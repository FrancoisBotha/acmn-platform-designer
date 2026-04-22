import type { Project, OpenProjectResult, BackupEntry, RecentProject, NewProjectParams } from '../contracts/backend'

export interface RecoveryOption {
  filePath: string
  tmpPath: string
  lastSavedPath: string
  backupPaths: string[]
  backupMtimes: string[]
}

export interface RecoveryChoice {
  filePath: string
  choice: 'use-tmp' | 'use-last-saved' | 'use-backup'
  backupIndex?: number
}

export interface AcmnApi {
  project: {
    create(params: NewProjectParams): Promise<Project>
    open(projectPath: string): Promise<OpenProjectResult>
    save(project: Project): Promise<void>
    saveAs(project: Project, newPath: string): Promise<Project>
    close(): Promise<void>
    listRecent(): Promise<RecentProject[]>
    removeRecent(projectPath: string): Promise<void>
    recover(): Promise<RecoveryOption[]>
    applyRecovery(choice: RecoveryChoice): Promise<void>
    listBackups(filePath: string): Promise<BackupEntry[]>
    openFromBackup(projectPath: string, backupFilePath: string): Promise<OpenProjectResult>
  }
  dialog: {
    openFolder(): Promise<string | null>
    saveFolder(): Promise<string | null>
    checkFolderEmpty(folderPath: string): Promise<boolean>
  }
  window: {
    setTitle(title: string): Promise<void>
  }
}

declare global {
  interface Window {
    acmn: AcmnApi
  }
}
