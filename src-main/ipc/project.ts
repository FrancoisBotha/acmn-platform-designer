import { ipcMain } from 'electron'
import type { BackendContract, NewProjectParams, Project, CasePlanModel, RecoveryChoice } from '../backend/contract'
import type { LocalBackend } from '../backend/localBackend'
import { FutureVersionError, MigrationError, CorruptFileError } from '../storage/storageErrors'
import { scanForRecoveryOptions, applyRecovery } from '../storage/crashRecovery'

export interface SerializedStorageError {
  name: string
  message: string
  filePath?: string
  fileVersion?: string
  appVersion?: string
  fromVersion?: string
  toVersion?: string
  cause?: string
}

function toIpcError(err: unknown): Error | null {
  let detail: SerializedStorageError | null = null

  if (err instanceof FutureVersionError) {
    detail = {
      name: err.name,
      message: err.message,
      filePath: err.filePath,
      fileVersion: err.fileVersion,
      appVersion: err.appVersion,
    }
  } else if (err instanceof MigrationError) {
    detail = {
      name: err.name,
      message: err.message,
      filePath: err.filePath,
      fromVersion: err.fromVersion,
      toVersion: err.toVersion,
      cause: err.cause instanceof Error ? err.cause.message : String(err.cause),
    }
  } else if (err instanceof CorruptFileError) {
    detail = {
      name: err.name,
      message: err.message,
      filePath: err.filePath,
      cause: err.cause instanceof Error ? err.cause.message : String(err.cause),
    }
  }

  if (!detail) return null

  const ipcErr = new Error(JSON.stringify(detail))
  ipcErr.name = detail.name
  return ipcErr
}

async function wrapHandler<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn()
  } catch (err) {
    throw toIpcError(err) ?? err
  }
}

export function registerProjectHandlers(backend: BackendContract): void {
  ipcMain.handle('project:new', (_event, params: NewProjectParams) => {
    return wrapHandler(() => backend.newProject(params))
  })

  ipcMain.handle('project:open', (_event, projectPath: string) => {
    return wrapHandler(() => backend.openProject(projectPath))
  })

  ipcMain.handle('project:save', (_event, project: Project) => {
    return wrapHandler(() => backend.saveProject(project))
  })

  ipcMain.handle('project:saveAs', (_event, project: Project, newPath: string) => {
    return wrapHandler(() => backend.saveProjectAs(project, newPath))
  })

  ipcMain.handle('project:close', () => {
    return Promise.resolve()
  })

  ipcMain.handle('project:listRecent', () => {
    return backend.getRecentProjects()
  })

  ipcMain.handle('project:removeRecent', (_event, projectPath: string) => {
    return backend.removeRecentProject(projectPath)
  })

  ipcMain.handle('project:recover', async () => {
    const recentProjects = await backend.getRecentProjects()
    if (recentProjects.length === 0) {
      return []
    }
    const lastOpened = recentProjects[0]
    return scanForRecoveryOptions(lastOpened.path)
  })

  ipcMain.handle('project:applyRecovery', (_event, choice: RecoveryChoice) => {
    return applyRecovery(choice)
  })

  const local = backend as LocalBackend

  ipcMain.handle('project:listBackups', (_event, filePath: string) => {
    return local.listBackups(filePath)
  })

  ipcMain.handle('project:openFromBackup', (_event, projectPath: string, backupFilePath: string) => {
    return wrapHandler(() => local.openFromBackup(projectPath, backupFilePath))
  })

  ipcMain.handle('cpm:load', (_event, projectPath: string, cpmFile: string) => {
    return wrapHandler(() => local.getCasePlanModel(projectPath, cpmFile))
  })

  ipcMain.handle('cpm:save', (_event, projectPath: string, cpm: CasePlanModel) => {
    return wrapHandler(() => local.saveCasePlanModel(projectPath, cpm))
  })
}
