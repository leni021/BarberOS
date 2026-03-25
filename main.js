const { app, BrowserWindow, dialog } = require('electron')
const { autoUpdater } = require('electron-updater')
const fs = require('fs')
const path = require('path')

let mainWindow = null
let ultimoBloqueProgreso = -1
let rutaLogUpdater = ''

function escribirLogUpdater(mensaje) {
  try {
    let marcaTiempo = new Date().toISOString()
    let linea = `[${marcaTiempo}] ${mensaje}\n`

    console.log(linea.trim())

    if (rutaLogUpdater) {
      fs.appendFileSync(rutaLogUpdater, linea, 'utf8')
    }
  } catch (error) {
    console.error('No se pudo escribir en update.log:', error)
  }
}

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
    escribirLogUpdater('Auto-update: buscando actualizaciones...')
  })

  autoUpdater.on('update-available', (info) => {
    ultimoBloqueProgreso = -1
    escribirLogUpdater(`Auto-update: actualizacion disponible -> version ${info && info.version ? info.version : 'desconocida'}`)

    if (mainWindow) {
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Actualizacion disponible',
        message: 'Se encontro una nueva version. Se descargara en segundo plano.'
      })
    }
  })

  autoUpdater.on('update-not-available', () => {
    escribirLogUpdater('Auto-update: no hay actualizaciones disponibles.')
  })

  autoUpdater.on('download-progress', (progreso) => {
    if (!mainWindow) return

    let porcentaje = Math.max(0, Math.min(100, progreso.percent || 0))
    mainWindow.setProgressBar(porcentaje / 100)

    let bloque = Math.floor(porcentaje / 10)
    if (bloque > ultimoBloqueProgreso) {
      ultimoBloqueProgreso = bloque
      escribirLogUpdater(`Auto-update: descarga ${porcentaje.toFixed(1)}%`) 
    }
  })

  autoUpdater.on('update-downloaded', async (info) => {
    escribirLogUpdater(`Auto-update: descarga finalizada -> version ${info && info.version ? info.version : 'desconocida'}`)

    if (mainWindow) mainWindow.setProgressBar(-1)

    if (!mainWindow) {
      escribirLogUpdater('Auto-update: instalacion automatica al cerrar app (sin ventana activa).')
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
      escribirLogUpdater('Auto-update: usuario acepto reiniciar para instalar.')
      autoUpdater.quitAndInstall()
    } else {
      escribirLogUpdater('Auto-update: usuario pospuso la instalacion.')
    }
  })

  autoUpdater.on('error', (error) => {
    escribirLogUpdater(`Auto-update error: ${error && error.message ? error.message : String(error)}`)

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
  let userDataPath = app.getPath('userData')
  rutaLogUpdater = path.join(userDataPath, 'update.log')
  escribirLogUpdater(`Logger de auto-update inicializado en: ${rutaLogUpdater}`)

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