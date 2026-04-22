import { ipcMain } from 'electron'
import type { BackendContract, NewProjectParams, Project } from '../backend/contract'

export function registerProjectHandlers(backend: BackendContract): void {
  ipcMain.handle('project:new', (_event, params: NewProjectParams) => {
    return backend.newProject(params)
  })

  ipcMain.handle('project:open', (_event, projectPath: string) => {
    return backend.openProject(projectPath)
  })

  ipcMain.handle('project:save', (_event, project: Project) => {
    return backend.saveProject(project)
  })

  ipcMain.handle('project:saveAs', (_event, project: Project, newPath: string) => {
    return backend.saveProject({ ...project, path: newPath })
  })

  ipcMain.handle('project:close', () => {
    return Promise.resolve()
  })

  ipcMain.handle('project:listRecent', () => {
    return backend.getRecentProjects()
  })
}
