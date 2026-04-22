import { app, BrowserWindow } from 'electron'
import path from 'path'
import type { BackendContract } from './backend/contract'
import { RemoteBackend } from './backend/remoteBackend'

let mainWindow: BrowserWindow | null = null
let backend: BackendContract

function createBackend(): BackendContract {
  const setting = process.env.ACMN_BACKEND ?? 'local'

  if (setting === 'remote') {
    return new RemoteBackend()
  }

  // LocalBackend is not yet implemented — will be added by a subsequent ticket.
  // For now, fall through to RemoteBackend as a placeholder when 'local' is selected,
  // since LocalBackend does not exist yet. This keeps the factory structure correct
  // while allowing the spike code to continue running (it doesn't call backend methods).
  return new RemoteBackend()
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
