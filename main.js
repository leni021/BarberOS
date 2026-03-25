const { app, BrowserWindow, dialog } = require('electron')
const { autoUpdater } = require('electron-updater')

let mainWindow = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  })

  mainWindow.loadFile('frontend/pages/login.html')
}

function configurarAutoUpdate() {
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('update-available', () => {
    if (mainWindow) {
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Actualizacion disponible',
        message: 'Se encontro una nueva version. Se descargara en segundo plano.'
      })
    }
  })

  autoUpdater.on('update-downloaded', async () => {
    if (!mainWindow) {
      autoUpdater.quitAndInstall()
      return
    }

    const respuesta = await dialog.showMessageBox(mainWindow, {
      type: 'question',
      title: 'Actualizacion lista',
      message: 'La actualizacion se descargo correctamente.',
      detail: '¿Deseas reiniciar ahora para instalarla?',
      buttons: ['Reiniciar ahora', 'Mas tarde'],
      defaultId: 0,
      cancelId: 1
    })

    if (respuesta.response === 0) {
      autoUpdater.quitAndInstall()
    }
  })

  autoUpdater.on('error', (error) => {
    console.error('Error de auto-update:', error)
  })
}

app.whenReady().then(() => {
  createWindow()
  configurarAutoUpdate()
  autoUpdater.checkForUpdatesAndNotify()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})