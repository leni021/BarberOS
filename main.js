const { app, BrowserWindow, dialog } = require('electron')
const { autoUpdater } = require('electron-updater')
const fs = require('fs')
const path = require('path')

let mainWindow = null
let ultimoBloqueProgreso = -1
let rutaLogUpdater = ''

function rotarLogSiExcedeLimite(rutaArchivo, limiteBytes = 2 * 1024 * 1024) {
  try {
    if (!rutaArchivo || !fs.existsSync(rutaArchivo)) return

    let stats = fs.statSync(rutaArchivo)
    if (stats.size <= limiteBytes) return

    let rutaRotada = `${rutaArchivo}.1`
    if (fs.existsSync(rutaRotada)) {
      fs.unlinkSync(rutaRotada)
    }

    fs.renameSync(rutaArchivo, rutaRotada)
  } catch (error) {
    console.error('No se pudo rotar el log local:', error)
  }
}

function escribirLogUpdater(mensaje) {
  try {
    let marcaTiempo = new Date().toISOString()
    let linea = `[${marcaTiempo}] ${mensaje}\n`

    console.log(linea.trim())

    if (rutaLogUpdater) {
      rotarLogSiExcedeLimite(rutaLogUpdater)
      fs.appendFileSync(rutaLogUpdater, linea, 'utf8')
    }
  } catch (error) {
    console.error('No se pudo escribir en update.log:', error)
  }
}

function configurarDiagnosticoRenderer(ventana) {
  if (!ventana || !ventana.webContents) return

  ventana.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    let esErrorConsola = level >= 2
    let esMensajeMonitoreado = typeof message === 'string' && message.includes('[BARBEROS][FRONTEND]')

    if (!esErrorConsola && !esMensajeMonitoreado) return

    let origen = sourceId || 'renderer'
    let linea = Number.isFinite(Number(line)) ? Number(line) : 0
    escribirLogUpdater(`Frontend console level=${level} ${origen}:${linea} -> ${String(message)}`)
  })

  ventana.webContents.on('render-process-gone', (_event, details) => {
    escribirLogUpdater(`Renderer caido: reason=${details && details.reason ? details.reason : 'desconocida'}, exitCode=${details && Number.isFinite(details.exitCode) ? details.exitCode : 'N/A'}`)
  })

  ventana.webContents.on('unresponsive', () => {
    escribirLogUpdater('Renderer no responde (unresponsive).')
  })
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

  configurarDiagnosticoRenderer(mainWindow)
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
  escribirLogUpdater(`Logger local inicializado en: ${rutaLogUpdater}`)

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