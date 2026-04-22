import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('acmn', {
  project: {
    create: (params: { name: string; location: string; description?: string; template?: string }) =>
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

    recover: () =>
      ipcRenderer.invoke('project:recover'),

    applyRecovery: (choice: {
      filePath: string
      choice: 'use-tmp' | 'use-last-saved' | 'use-backup'
      backupIndex?: number
    }) => ipcRenderer.invoke('project:applyRecovery', choice),

    listBackups: (filePath: string) =>
      ipcRenderer.invoke('project:listBackups', filePath),

    openFromBackup: (projectPath: string, backupFilePath: string) =>
      ipcRenderer.invoke('project:openFromBackup', projectPath, backupFilePath),
  },

  dialog: {
    openFolder: () =>
      ipcRenderer.invoke('dialog:openFolder'),

    saveFolder: () =>
      ipcRenderer.invoke('dialog:saveFolder'),

    checkFolderEmpty: (folderPath: string) =>
      ipcRenderer.invoke('dialog:checkFolderEmpty', folderPath),
  },

  window: {
    setTitle: (title: string) =>
      ipcRenderer.invoke('window:setTitle', title),
  },

  autoSave: {
    onFlushRequest: (callback: () => void) => {
      ipcRenderer.on('autosave:flush-request', () => callback())
    },
    flushDone: () => ipcRenderer.send('autosave:flush-done'),
  },
})
