const { app, BrowserWindow, dialog, shell } = require('electron')
const { autoUpdater } = require('electron-updater')
const fs = require('fs')
const path = require('path')
const { URL } = require('url')

let mainWindow = null
let ultimoBloqueProgreso = -1
let rutaLogUpdater = ''
let ultimoChequeoRotacionLog = 0
const URL_RELEASES = 'https://github.com/leni021/BarberOS/releases/latest'

function esUrlExternaPermitida(urlTexto) {
  try {
    const url = new URL(urlTexto)
    const protocoloSeguro = url.protocol === 'https:'
    const hostPermitido = ['github.com', 'wa.me'].includes(url.hostname)
    return protocoloSeguro && hostPermitido
  } catch (_error) {
    return false
  }
}

function abrirExternoSeguro(urlTexto) {
  if (!esUrlExternaPermitida(urlTexto)) {
    escribirLogUpdater(`Bloqueada apertura externa no permitida: ${String(urlTexto)}`)
    return
  }

  shell.openExternal(urlTexto)
}

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
      let ahora = Date.now()
      if (ahora - ultimoChequeoRotacionLog > 30000) {
        ultimoChequeoRotacionLog = ahora
        rotarLogSiExcedeLimite(rutaLogUpdater)
      }

      fs.appendFile(rutaLogUpdater, linea, 'utf8', (error) => {
        if (error) {
          console.error('No se pudo escribir en update.log:', error)
        }
      })
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

async function mostrarFallbackInstalacionManual(motivo) {
  let detalleMotivo = motivo ? `\n\nDetalle tecnico: ${motivo}` : ''

  escribirLogUpdater(`Auto-update: se activa fallback manual. Motivo: ${motivo || 'sin detalle'}`)

  if (!mainWindow) {
    abrirExternoSeguro(URL_RELEASES)
    return
  }

  const respuesta = await dialog.showMessageBox(mainWindow, {
    type: 'warning',
    title: 'Instalacion manual requerida',
    message: 'No se pudo completar la instalacion automatica en este intento.',
    detail: `La app puede recuperarse con una instalacion manual guiada:\n1) Abrir descargas oficiales\n2) Descargar el instalador mas reciente\n3) Ejecutarlo sobre la version actual (sin desinstalar)\n\nEsto solo se usa cuando el auto-update falla.${detalleMotivo}`,
    buttons: ['Abrir descargas', 'Cancelar'],
    defaultId: 0,
    cancelId: 1
  })

  if (respuesta.response === 0) {
    abrirExternoSeguro(URL_RELEASES)
  }
}

async function intentarInstalarActualizacion() {
  try {
    autoUpdater.quitAndInstall()
  } catch (error) {
    let detalle = error && error.message ? error.message : String(error)
    escribirLogUpdater(`Auto-update: fallo quitAndInstall -> ${detalle}`)
    await mostrarFallbackInstalacionManual(detalle)
  }
}

function createWindow() {
  const versionActual = app.getVersion()

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

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    abrirExternoSeguro(url)
    return { action: 'deny' }
  })

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url || url.startsWith('file://')) return
    event.preventDefault()
    abrirExternoSeguro(url)
  })

  mainWindow.loadFile('frontend/pages/login.html', {
    query: {
      v: versionActual
    }
  })
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
      await intentarInstalarActualizacion()
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
      await intentarInstalarActualizacion()
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

function programarChequeoActualizaciones() {
  // Evita competir con el primer render del login y mejora el arranque percibido.
  setTimeout(() => {
    autoUpdater.checkForUpdatesAndNotify()
  }, 6000)
}

app.whenReady().then(() => {
  let userDataPath = app.getPath('userData')
  rutaLogUpdater = path.join(userDataPath, 'update.log')
  escribirLogUpdater(`Logger local inicializado en: ${rutaLogUpdater}`)

  createWindow()
  configurarAutoUpdate()
  programarChequeoActualizaciones()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})