// ---- Authentication types ----

export interface Credentials {
  token?: string
  username?: string
  password?: string
}

export interface AuthResult {
  success: boolean
  user: User | null
  error?: string
}

export interface User {
  id: string
  displayName: string
  email?: string
}

// ---- Project types ----

export interface NewProjectParams {
  name: string
  location: string
  description?: string
  template?: string
}

export interface Project {
  id: string
  name: string
  description: string
  path: string
  acmnVersion: string
  projectFormat: string
  created: string
  modified: string
  author: string
  casePlanModels: CasePlanModelRef[]
  domainContexts: DomainContextRef[]
}

export interface CasePlanModelRef {
  id: string
  file: string
}

export interface DomainContextRef {
  id: string
  file: string
}

export interface RecentProject {
  name: string
  path: string
  lastModified: string
  missing?: boolean
}

export interface OpenProjectResult {
  project: Project
  migrationApplied?: {
    fromVersion: string
    toVersion: string
    backupPath: string
  }
}

export interface BackupEntry {
  path: string
  label: string
  modifiedAt: string
}

// ---- Case plan model types ----

export interface CasePlanModelSummary {
  id: string
  name: string
  file: string
}

export interface CasePlanModel {
  id: string
  name: string
  version: string
  nodes: CasePlanModelNode[]
  edges: CasePlanModelEdge[]
  stages: Stage[]
  milestones: Milestone[]
  sentries: Sentry[]
  caseVariables: CaseVariable[]
  domainContextRef?: DomainContextBinding
  createdAt: string
  updatedAt: string
}

export interface CasePlanModelNode {
  id: string
  type: string
  label: string
  position: { x: number; y: number }
  parentId?: string
  properties: Record<string, unknown>
}

export interface CasePlanModelEdge {
  id: string
  source: string
  target: string
  type: string
  label?: string
}

export interface Stage {
  id: string
  name: string
  parentId?: string
}

export interface Milestone {
  id: string
  name: string
  sentryRef?: string
}

export interface Sentry {
  id: string
  name: string
  conditions: SentryCondition[]
}

export interface SentryCondition {
  type: string
  expression: string
}

export interface CaseVariable {
  id: string
  name: string
  dataType: string
  defaultValue?: string
}

export interface DomainContextBinding {
  id: string
  version: string
  bindingMode: 'embedded' | 'referenced'
}

// ---- Validation & publish types ----

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationError {
  path: string
  message: string
}

export interface ValidationWarning {
  path: string
  message: string
}

export interface PublishParams {
  projectId: string
  casePlanModelId: string
  outputPath?: string
}

export interface PublishResult {
  success: boolean
  outputPath: string
  error?: string
}

// ---- Domain context types ----

export interface DomainContextSummary {
  id: string
  name: string
  version: string
}

export interface DomainContext {
  id: string
  name: string
  version: string
  vocabulary: Record<string, unknown>
  entitySchemas: Record<string, unknown>
  valueObjectSchemas: Record<string, unknown>
  domainRules: Record<string, unknown>
  decisionModels: Record<string, unknown>
  domainEvents?: Record<string, unknown>
  toolCatalogue?: Record<string, unknown>
  origin?: DomainContextOrigin
}

export interface DomainContextOrigin {
  sourceId: string
  sourceVersion: string
  copiedAt: string
}

// ---- Test types ----

export interface TestScenarioParams {
  projectId: string
  scenarioId: string
  casePlanModelId: string
}

export type TestRunId = string

export interface TestEvent {
  type: string
  timestamp: string
  data: Record<string, unknown>
}

export interface TestScenario {
  id: string
  name: string
  description?: string
  steps: TestStep[]
  expectedOutcomes: TestExpectedOutcome[]
}

export interface TestStep {
  id: string
  action: string
  target: string
  payload: Record<string, unknown>
}

export interface TestExpectedOutcome {
  id: string
  description: string
  assertion: string
}

// ---- Recovery types ----

export interface RecoveryOption {
  filePath: string
  tmpPath: string
  lastSavedPath: string
  backupPaths: string[]
}

export interface RecoveryChoice {
  filePath: string
  choice: 'use-tmp' | 'use-last-saved' | 'use-backup'
  backupIndex?: number
}

// ---- Backend contract ----

export interface BackendContract {
  // ==== Authentication (no-op in v0.1) ====
  authenticate(credentials?: Credentials): Promise<AuthResult>
  getCurrentUser(): Promise<User | null>

  // ==== Project management ====
  newProject(params: NewProjectParams): Promise<Project>
  openProject(path: string): Promise<OpenProjectResult>
  saveProject(project: Project): Promise<void>
  saveProjectAs(project: Project, newPath: string): Promise<Project>
  getRecentProjects(): Promise<RecentProject[]>
  removeRecentProject(projectPath: string): Promise<void>

  // ==== Case plan models ====
  listCasePlanModels(projectId: string): Promise<CasePlanModelSummary[]>
  getCasePlanModel(projectId: string, id: string): Promise<CasePlanModel>
  saveCasePlanModel(projectId: string, cpm: CasePlanModel): Promise<void>
  deleteCasePlanModel(projectId: string, id: string): Promise<void>
  validateCasePlanModel(cpm: CasePlanModel): Promise<ValidationResult>
  publishCasePlanModel(params: PublishParams): Promise<PublishResult>

  // ==== Domain contexts ====
  listDomainContextLibrary(): Promise<DomainContextSummary[]>
  getDomainContext(id: string, version?: string): Promise<DomainContext>
  createDomainContext(dc: DomainContext): Promise<void>
  forkDomainContext(sourceId: string, sourceVersion: string): Promise<DomainContext>
  saveDomainContext(dc: DomainContext): Promise<void>
  publishDomainContext(dc: DomainContext): Promise<void>
  installDomainContextPackage(packageId: string, version?: string): Promise<void>

  // ==== Test mode ====
  runTestScenario(params: TestScenarioParams): Promise<TestRunId>
  getTestRunEvents(runId: TestRunId): AsyncIterable<TestEvent>
  cancelTestRun(runId: TestRunId): Promise<void>

  // ==== Test scenarios ====
  listTestScenarios(projectId: string): Promise<TestScenario[]>
  saveTestScenario(projectId: string, ts: TestScenario): Promise<void>
  deleteTestScenario(projectId: string, id: string): Promise<void>
}
