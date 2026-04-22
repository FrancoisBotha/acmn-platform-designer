import type { Project, RecentProject, NewProjectParams } from '../contracts/backend'

export interface AcmnApi {
  project: {
    create(params: NewProjectParams): Promise<Project>
    open(projectPath: string): Promise<Project>
    save(project: Project): Promise<void>
    saveAs(project: Project, newPath: string): Promise<void>
    close(): Promise<void>
    listRecent(): Promise<RecentProject[]>
  }
  dialog: {
    openFolder(): Promise<string | null>
    saveFolder(): Promise<string | null>
    checkFolderEmpty(folderPath: string): Promise<boolean>
  }
}

declare global {
  interface Window {
    acmn: AcmnApi
  }
}
