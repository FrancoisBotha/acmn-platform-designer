import type { Project, RecentProject, NewProjectParams } from '../contracts/backend'

export interface AcmnApi {
  project: {
    create(params: NewProjectParams): Promise<Project>
    open(projectPath: string): Promise<Project>
    save(project: Project): Promise<void>
    saveAs(project: Project, newPath: string): Promise<Project>
    close(): Promise<void>
    listRecent(): Promise<RecentProject[]>
    removeRecent(projectPath: string): Promise<void>
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
