const { app, BrowserWindow, dialog } = require('electron')
const { autoUpdater } = require('electron-updater')

let mainWindow = null
let ultimoBloqueProgreso = -1

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

  autoUpdater.on('checking-for-update', () => {
    console.log('Auto-update: buscando actualizaciones...')
  })

  autoUpdater.on('update-available', () => {
    ultimoBloqueProgreso = -1
    if (mainWindow) {
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Actualizacion disponible',
        message: 'Se encontro una nueva version. Se descargara en segundo plano.'
      })
    }
  })

  autoUpdater.on('update-not-available', () => {
    console.log('Auto-update: no hay actualizaciones disponibles.')
  })

  autoUpdater.on('download-progress', (progreso) => {
    if (!mainWindow) return

    let porcentaje = Math.max(0, Math.min(100, progreso.percent || 0))
    mainWindow.setProgressBar(porcentaje / 100)

    let bloque = Math.floor(porcentaje / 10)
    if (bloque > ultimoBloqueProgreso) {
      ultimoBloqueProgreso = bloque
      console.log(`Auto-update: descarga ${porcentaje.toFixed(1)}%`) 
    }
  })

  autoUpdater.on('update-downloaded', async () => {
    if (mainWindow) mainWindow.setProgressBar(-1)

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

    if (mainWindow) {
      mainWindow.setProgressBar(-1)
      dialog.showMessageBox(mainWindow, {
        type: 'error',
        title: 'Error al actualizar',
        message: 'No se pudo descargar o instalar la actualizacion.',
        detail: `Detalle tecnico: ${error && error.message ? error.message : String(error)}\n\nRevisa conexion a internet y que el repositorio/release sea accesible.`
      })
    }
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