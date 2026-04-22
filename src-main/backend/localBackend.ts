import fs from 'fs/promises'
import path from 'path'
import { app } from 'electron'
import { randomUUID } from 'crypto'
import { writeAtomic } from '../storage/atomicWrite'
import type {
  BackendContract,
  Credentials,
  AuthResult,
  User,
  NewProjectParams,
  Project,
  RecentProject,
  CasePlanModelSummary,
  CasePlanModel,
  ValidationResult,
  PublishParams,
  PublishResult,
  DomainContextSummary,
  DomainContext,
  TestScenarioParams,
  TestRunId,
  TestEvent,
  TestScenario,
} from './contract'

const MANIFEST_FILENAME = 'project.acmn.json'
const RECENT_FILENAME = 'recent.json'
const MAX_RECENT = 10

const PROJECT_SUBDIRS = [
  'case-plan-models',
  'domain-contexts',
  'test-scenarios',
  'assets',
  'dist',
] as const

export class PathTraversalError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PathTraversalError'
  }
}

export class ProjectNotFoundError extends Error {
  constructor(projectPath: string) {
    super(`Project manifest not found: ${path.join(projectPath, MANIFEST_FILENAME)}`)
    this.name = 'ProjectNotFoundError'
  }
}

function validatePath(userPath: string, basePath: string): void {
  const normalised = path.normalize(userPath)

  if (normalised.split(path.sep).includes('..')) {
    throw new PathTraversalError(`Path contains disallowed '..' segment: ${userPath}`)
  }

  if (path.posix.normalize(userPath).split('/').includes('..')) {
    throw new PathTraversalError(`Path contains disallowed '..' segment: ${userPath}`)
  }

  const resolved = path.resolve(basePath, normalised)
  const resolvedBase = path.resolve(basePath)

  if (!resolved.startsWith(resolvedBase + path.sep) && resolved !== resolvedBase) {
    throw new PathTraversalError(
      `Path resolves outside the allowed base directory: ${userPath}`
    )
  }
}

function validateAbsolutePath(absPath: string): void {
  const normalised = path.normalize(absPath)

  if (normalised.split(path.sep).includes('..')) {
    throw new PathTraversalError(`Path contains disallowed '..' segment: ${absPath}`)
  }
}

interface ProjectManifest {
  acmnVersion: string
  projectFormat: string
  id: string
  name: string
  description: string
  created: string
  modified: string
  author: string
  casePlanModels: { id: string; file: string }[]
  domainContexts: { id: string; file: string }[]
}

function manifestToProject(manifest: ProjectManifest, projectPath: string): Project {
  return {
    id: manifest.id,
    name: manifest.name,
    description: manifest.description,
    path: projectPath,
    acmnVersion: manifest.acmnVersion,
    projectFormat: manifest.projectFormat,
    created: manifest.created,
    modified: manifest.modified,
    author: manifest.author,
    casePlanModels: manifest.casePlanModels,
    domainContexts: manifest.domainContexts,
  }
}

function projectToManifest(project: Project): ProjectManifest {
  return {
    acmnVersion: project.acmnVersion,
    projectFormat: project.projectFormat,
    id: project.id,
    name: project.name,
    description: project.description,
    created: project.created,
    modified: project.modified,
    author: project.author,
    casePlanModels: project.casePlanModels,
    domainContexts: project.domainContexts,
  }
}

export class LocalBackend implements BackendContract {
  // ==== Authentication (no-op in v0.1) ====

  async authenticate(_credentials?: Credentials): Promise<AuthResult> {
    return {
      success: true,
      user: await this.getCurrentUser(),
    }
  }

  async getCurrentUser(): Promise<User> {
    return {
      id: 'local-user',
      displayName: 'Local User',
    }
  }

  // ==== Project management ====

  async newProject(params: NewProjectParams): Promise<Project> {
    validateAbsolutePath(params.location)

    const projectPath = path.join(params.location, params.name)
    const now = new Date().toISOString()

    await fs.mkdir(projectPath, { recursive: true })

    for (const subdir of PROJECT_SUBDIRS) {
      await fs.mkdir(path.join(projectPath, subdir), { recursive: true })
    }

    const manifest: ProjectManifest = {
      acmnVersion: '0.1.0',
      projectFormat: '1',
      id: randomUUID(),
      name: params.name,
      description: params.description ?? '',
      created: now,
      modified: now,
      author: 'Local User',
      casePlanModels: [],
      domainContexts: [],
    }

    await writeAtomic(
      path.join(projectPath, MANIFEST_FILENAME),
      JSON.stringify(manifest, null, 2),
      { rotate: true }
    )

    const project = manifestToProject(manifest, projectPath)

    await this.addToRecentProjects(project)

    return project
  }

  async openProject(projectPath: string): Promise<Project> {
    validateAbsolutePath(projectPath)

    const manifestPath = path.join(projectPath, MANIFEST_FILENAME)

    try {
      await fs.access(manifestPath)
    } catch {
      throw new ProjectNotFoundError(projectPath)
    }

    const raw = await fs.readFile(manifestPath, 'utf-8')
    const manifest: ProjectManifest = JSON.parse(raw)

    const project = manifestToProject(manifest, projectPath)

    await this.addToRecentProjects(project)

    return project
  }

  async saveProject(project: Project): Promise<void> {
    validateAbsolutePath(project.path)

    const manifest = projectToManifest({
      ...project,
      modified: new Date().toISOString(),
    })

    await writeAtomic(
      path.join(project.path, MANIFEST_FILENAME),
      JSON.stringify(manifest, null, 2),
      { rotate: true }
    )
  }

  async saveProjectAs(project: Project, newPath: string): Promise<Project> {
    validateAbsolutePath(newPath)

    const newCasePlanModels = project.casePlanModels.map((cpm) => ({
      id: randomUUID(),
      file: cpm.file,
    }))

    const newDomainContexts = project.domainContexts.map((dc) => ({
      id: randomUUID(),
      file: dc.file,
    }))

    const saved: Project = {
      ...project,
      id: randomUUID(),
      path: newPath,
      modified: new Date().toISOString(),
      casePlanModels: newCasePlanModels,
      domainContexts: newDomainContexts,
    }

    const manifest = projectToManifest(saved)

    await fs.mkdir(newPath, { recursive: true })

    for (const subdir of PROJECT_SUBDIRS) {
      await fs.mkdir(path.join(newPath, subdir), { recursive: true })
    }

    // Copy assets from original project
    const srcAssets = path.join(project.path, 'assets')
    try {
      const entries = await fs.readdir(srcAssets)
      if (entries.length > 0) {
        await fs.cp(srcAssets, path.join(newPath, 'assets'), { recursive: true })
      }
    } catch {
      // Source assets directory may not exist
    }

    // Copy case plan model files
    for (let i = 0; i < project.casePlanModels.length; i++) {
      const srcFile = path.join(project.path, project.casePlanModels[i].file)
      const dstFile = path.join(newPath, newCasePlanModels[i].file)
      try {
        await fs.mkdir(path.dirname(dstFile), { recursive: true })
        await fs.copyFile(srcFile, dstFile)
      } catch {
        // File may not exist yet
      }
    }

    await writeAtomic(
      path.join(newPath, MANIFEST_FILENAME),
      JSON.stringify(manifest, null, 2),
      { rotate: true }
    )

    await this.addToRecentProjects(saved)

    return saved
  }

  async getRecentProjects(): Promise<RecentProject[]> {
    const entries = await this.readRecentFile()

    const results: RecentProject[] = []
    for (const entry of entries) {
      const manifestPath = path.join(entry.path, MANIFEST_FILENAME)
      try {
        await fs.access(manifestPath)
        results.push({ name: entry.name, path: entry.path, lastModified: entry.lastModified })
      } catch {
        results.push({ name: entry.name, path: entry.path, lastModified: entry.lastModified, missing: true })
      }
    }

    return results
  }

  async removeRecentProject(projectPath: string): Promise<void> {
    const entries = await this.readRecentFile()
    const filtered = entries.filter((r) => r.path !== projectPath)
    const recentPath = this.getRecentFilePath()
    await fs.mkdir(path.dirname(recentPath), { recursive: true })
    await writeAtomic(recentPath, JSON.stringify(filtered, null, 2))
  }

  // ==== Case plan models (not implemented in this ticket) ====

  async listCasePlanModels(_projectId: string): Promise<CasePlanModelSummary[]> {
    throw new Error('not yet implemented')
  }

  async getCasePlanModel(_projectId: string, _id: string): Promise<CasePlanModel> {
    throw new Error('not yet implemented')
  }

  async saveCasePlanModel(_projectId: string, _cpm: CasePlanModel): Promise<void> {
    throw new Error('not yet implemented')
  }

  async deleteCasePlanModel(_projectId: string, _id: string): Promise<void> {
    throw new Error('not yet implemented')
  }

  async validateCasePlanModel(_cpm: CasePlanModel): Promise<ValidationResult> {
    throw new Error('not yet implemented')
  }

  async publishCasePlanModel(_params: PublishParams): Promise<PublishResult> {
    throw new Error('not yet implemented')
  }

  // ==== Domain contexts (not implemented in this ticket) ====

  async listDomainContextLibrary(): Promise<DomainContextSummary[]> {
    throw new Error('not yet implemented')
  }

  async getDomainContext(_id: string, _version?: string): Promise<DomainContext> {
    throw new Error('not yet implemented')
  }

  async createDomainContext(_dc: DomainContext): Promise<void> {
    throw new Error('not yet implemented')
  }

  async forkDomainContext(_sourceId: string, _sourceVersion: string): Promise<DomainContext> {
    throw new Error('not yet implemented')
  }

  async saveDomainContext(_dc: DomainContext): Promise<void> {
    throw new Error('not yet implemented')
  }

  async publishDomainContext(_dc: DomainContext): Promise<void> {
    throw new Error('not yet implemented')
  }

  async installDomainContextPackage(_packageId: string, _version?: string): Promise<void> {
    throw new Error('not yet implemented')
  }

  // ==== Test mode (not implemented in this ticket) ====

  async runTestScenario(_params: TestScenarioParams): Promise<TestRunId> {
    throw new Error('not yet implemented')
  }

  async *getTestRunEvents(_runId: TestRunId): AsyncIterable<TestEvent> {
    throw new Error('not yet implemented')
  }

  async cancelTestRun(_runId: TestRunId): Promise<void> {
    throw new Error('not yet implemented')
  }

  async listTestScenarios(_projectId: string): Promise<TestScenario[]> {
    throw new Error('not yet implemented')
  }

  async saveTestScenario(_projectId: string, _ts: TestScenario): Promise<void> {
    throw new Error('not yet implemented')
  }

  async deleteTestScenario(_projectId: string, _id: string): Promise<void> {
    throw new Error('not yet implemented')
  }

  // ==== Internal helpers ====

  private getRecentFilePath(): string {
    return path.join(app.getPath('userData'), RECENT_FILENAME)
  }

  private async readRecentFile(): Promise<RecentProject[]> {
    try {
      const recentPath = this.getRecentFilePath()
      const raw = await fs.readFile(recentPath, 'utf-8')
      return JSON.parse(raw) as RecentProject[]
    } catch {
      return []
    }
  }

  private async addToRecentProjects(project: Project): Promise<void> {
    const recent = await this.readRecentFile()

    const filtered = recent.filter((r) => r.path !== project.path)

    filtered.unshift({
      name: project.name,
      path: project.path,
      lastModified: project.modified,
    })

    const trimmed = filtered.slice(0, MAX_RECENT)

    const recentPath = this.getRecentFilePath()
    await fs.mkdir(path.dirname(recentPath), { recursive: true })
    await writeAtomic(recentPath, JSON.stringify(trimmed, null, 2))
  }
}

export { validatePath, validateAbsolutePath }
