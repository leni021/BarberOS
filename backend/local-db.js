const path = require('path')

let DatabaseSync = null
try {
  ({ DatabaseSync } = require('node:sqlite'))
} catch (_error) {
  DatabaseSync = null
}

let db = null
let sqliteDisponible = false

function initLocalDb(userDataPath) {
  if (db) return db

  if (!DatabaseSync) {
    sqliteDisponible = false
    return null
  }

  const dbPath = path.join(userDataPath, 'barberos-local.db')
  db = new DatabaseSync(dbPath)
  db.exec("PRAGMA journal_mode = WAL;")
  db.exec("PRAGMA synchronous = NORMAL;")

  db.exec(`
    CREATE TABLE IF NOT EXISTS kv_store (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `)

  sqliteDisponible = true

  return db
}

function isAvailable() {
  return Boolean(sqliteDisponible && db)
}

function getStatus() {
  return {
    available: isAvailable(),
    engine: isAvailable() ? 'node:sqlite' : 'localStorage',
    persistent: isAvailable()
  }
}

function ensureDb() {
  if (!db) throw new Error('SQLite no disponible o no inicializada')
  return db
}

function readValue(key) {
  if (!db) return null

  const conn = ensureDb()
  const row = conn.prepare('SELECT value FROM kv_store WHERE key = ?').get(String(key))
  return row ? row.value : null
}

function writeValue(key, value) {
  if (!db) return false

  const conn = ensureDb()
  conn.prepare(`
    INSERT INTO kv_store (key, value, updated_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(key)
    DO UPDATE SET value = excluded.value, updated_at = datetime('now')
  `).run(String(key), String(value))
  return true
}

function removeValue(key) {
  if (!db) return false

  const conn = ensureDb()
  conn.prepare('DELETE FROM kv_store WHERE key = ?').run(String(key))
  return true
}

function listKeys() {
  if (!db) return []

  const conn = ensureDb()
  const rows = conn.prepare('SELECT key FROM kv_store ORDER BY key ASC').all()
  return rows.map((r) => r.key)
}

function bulkWrite(entries) {
  if (!db) return false

  const conn = ensureDb()
  const insert = conn.prepare(`
    INSERT INTO kv_store (key, value, updated_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(key)
    DO UPDATE SET value = excluded.value, updated_at = datetime('now')
  `)

  const tx = conn.transaction((items) => {
    items.forEach((item) => {
      if (!item || typeof item.key !== 'string') return
      insert.run(item.key, String(item.value ?? ''))
    })
  })

  tx(Array.isArray(entries) ? entries : [])
  return true
}

module.exports = {
  initLocalDb,
  isAvailable,
  getStatus,
  readValue,
  writeValue,
  removeValue,
  listKeys,
  bulkWrite
}
