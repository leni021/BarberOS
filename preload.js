const { contextBridge, ipcRenderer } = require('electron')

function call(channel, payload) {
  try {
    return ipcRenderer.sendSync(channel, payload)
  } catch (_error) {
    return null
  }
}

const initialStatus = call('db:status', {}) || { available: false, engine: 'localStorage', persistent: true }

contextBridge.exposeInMainWorld('barbeosDB', {
  available: Boolean(initialStatus && initialStatus.available),
  status: () => call('db:status', {}),
  read: (key) => call('db:read', { key }),
  write: (key, value) => call('db:write', { key, value }),
  remove: (key) => call('db:remove', { key }),
  keys: () => call('db:keys', {}),
  bulkWrite: (entries) => call('db:bulkWrite', { entries })
})
