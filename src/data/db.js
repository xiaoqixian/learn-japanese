// Date:   Mon May 25 23:00:37 2026
// Mail:   lunar_ubuntu@qq.com
// Author: https://github.com/xiaoqixian
// ── SQLite-backed word book persistence ─────────────────────────
import initSqlJs from 'sql.js/dist/sql-wasm.js'

let SQL = null
let db = null
let fileHandle = null

// ── Initialise SQL.js (lazy) ──────────────────────────────────
async function getSQL() {
  if (SQL) return SQL
  SQL = await initSqlJs({
    locateFile: () => '/sql-wasm.wasm',
  })
  return SQL
}

// ── File handle management ────────────────────────────────────
function getSavedHandle() {
  try {
    const raw = localStorage.getItem('wordbook-file-name')
    return raw || null
  } catch {
    return null
  }
}

function saveHandleName(name) {
  localStorage.setItem('wordbook-file-name', name)
}

function clearHandleName() {
  localStorage.removeItem('wordbook-file-name')
}

// ── Public API ────────────────────────────────────────────────

/** Whether a database file has been loaded */
export function isDbReady() {
  return db !== null
}

/** Get the file handle name (for display) */
export function getDbFileName() {
  return fileHandle ? fileHandle.name : getSavedHandle() || null
}

/**
 * Create a brand-new empty database and prompt user to save the file.
 * Returns the file name on success, or null if user cancelled.
 */
export async function createDatabase() {
  const sql = await getSQL()
  db = new sql.Database()
  db.run(`
    CREATE TABLE IF NOT EXISTS words (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      japanese TEXT NOT NULL,
      chinese TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Prompt user to save the file
  try {
    fileHandle = await window.showSaveFilePicker({
      suggestedName: 'wordbook.db',
      types: [
        {
          description: 'SQLite Database',
          accept: { 'application/octet-stream': ['.db', '.sqlite', '.sqlite3'] },
        },
      ],
    })
    saveHandleName(fileHandle.name)
    await saveToFile()
    return fileHandle.name
  } catch (err) {
    // User cancelled
    if (err.name === 'AbortError') return null
    throw err
  }
}

/**
 * Open an existing database file selected by the user.
 * Returns the file name on success, or null if user cancelled.
 */
export async function openDatabase() {
  const sql = await getSQL()

  try {
    ;[fileHandle] = await window.showOpenFilePicker({
      types: [
        {
          description: 'SQLite Database',
          accept: { 'application/octet-stream': ['.db', '.sqlite', '.sqlite3'] },
        },
      ],
      multiple: false,
    })
  } catch (err) {
    if (err.name === 'AbortError') return null
    throw err
  }

  const file = await fileHandle.getFile()
  const buffer = await file.arrayBuffer()
  db = new sql.Database(new Uint8Array(buffer))

  // Ensure table exists
  db.run(`
    CREATE TABLE IF NOT EXISTS words (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      japanese TEXT NOT NULL,
      chinese TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  saveHandleName(fileHandle.name)
  return fileHandle.name
}

/**
 * Try to re-open the last-used file. Requires user gesture context.
 * Returns file name on success, null if no saved handle or user cancelled.
 */
export async function reopenLastDatabase() {
  const savedName = getSavedHandle()
  if (!savedName) return null

  // We can't reuse file handles across sessions due to browser security.
  // Instead, prompt user to re-open.
  return null // Always need manual re-open
}

/**
 * Save current database state back to the file.
 */
async function saveToFile() {
  if (!db || !fileHandle) return

  const data = db.export()
  const writable = await fileHandle.createWritable()
  await writable.write(data)
  await writable.close()
}

// ── CRUD operations ───────────────────────────────────────────

/** Add a new word pair. Auto-saves after insert. */
export async function addWord(japanese, chinese) {
  if (!db) throw new Error('Database not loaded')
  db.run('INSERT INTO words (japanese, chinese) VALUES (?, ?)', [japanese, chinese])
  await saveToFile()
}

/** Delete a word by id. Auto-saves after delete. */
export async function deleteWord(id) {
  if (!db) throw new Error('Database not loaded')
  db.run('DELETE FROM words WHERE id = ?', [id])
  await saveToFile()
}

/** Update a word by id. Auto-saves after update. */
export async function updateWord(id, japanese, chinese) {
  if (!db) throw new Error('Database not loaded')
  db.run('UPDATE words SET japanese = ?, chinese = ? WHERE id = ?', [japanese, chinese, id])
  await saveToFile()
}

/** Get all words, ordered by most recent first. */
export function getAllWords() {
  if (!db) return []
  const results = []
  const stmt = db.prepare('SELECT id, japanese, chinese FROM words ORDER BY created_at DESC')
  while (stmt.step()) {
    const row = stmt.getAsObject()
    results.push(row)
  }
  stmt.free()
  return results
}

/** Close the database and release resources */
export function closeDatabase() {
  if (db) {
    db.close()
    db = null
    fileHandle = null
  }
}


