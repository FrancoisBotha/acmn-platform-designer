import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('acmn', {
  project: {
    new: (params: { name: string; location: string; description?: string; template?: string }) =>
      ipcRenderer.invoke('project:new', params),

    open: (projectPath: string) =>
      ipcRenderer.invoke('project:open', projectPath),

    save: (project: {
      id: string
      name: string
      description: string
      path: string
      acmnVersion: string
      projectFormat: string
      created: string
      modified: string
      author: string
      casePlanModels: { id: string; file: string }[]
      domainContexts: { id: string; file: string }[]
    }) => ipcRenderer.invoke('project:save', project),

    saveAs: (
      project: {
        id: string
        name: string
        description: string
        path: string
        acmnVersion: string
        projectFormat: string
        created: string
        modified: string
        author: string
        casePlanModels: { id: string; file: string }[]
        domainContexts: { id: string; file: string }[]
      },
      newPath: string
    ) => ipcRenderer.invoke('project:saveAs', project, newPath),

    close: () =>
      ipcRenderer.invoke('project:close'),

    listRecent: () =>
      ipcRenderer.invoke('project:listRecent'),

    removeRecent: (projectPath: string) =>
      ipcRenderer.invoke('project:removeRecent', projectPath),
  },

  dialog: {
    openFolder: () =>
      ipcRenderer.invoke('dialog:openFolder'),

    saveFolder: () =>
      ipcRenderer.invoke('dialog:saveFolder'),
  },
})
