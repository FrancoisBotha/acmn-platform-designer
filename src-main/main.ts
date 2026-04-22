import { app, BrowserWindow } from 'electron'
import path from 'path'
import type { BackendContract } from './backend/contract'
import { LocalBackend } from './backend/localBackend'
import { RemoteBackend } from './backend/remoteBackend'

let mainWindow: BrowserWindow | null = null
let backend: BackendContract

function createBackend(): BackendContract {
  const setting = process.env.ACMN_BACKEND ?? 'local'

  if (setting === 'remote') {
    return new RemoteBackend()
  }

  return new LocalBackend()
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(() => {
  backend = createBackend()
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

export { backend }
