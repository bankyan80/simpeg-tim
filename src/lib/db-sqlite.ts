import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const globalForDb = globalThis as unknown as {
  sqlite: Database.Database | undefined
}

function getDbPath(): string {
  const original = path.join(process.cwd(), 'db', 'custom.db')

  if (!process.env.VERCEL) return original

  const tmpPath = path.join('/tmp', 'custom.db')
  if (!fs.existsSync(tmpPath) && fs.existsSync(original)) {
    fs.copyFileSync(original, tmpPath)
  }
  return tmpPath
}

function initDb(): Database.Database {
  const existing = globalForDb.sqlite
  if (existing) return existing

  const dbPath = getDbPath()

  try {
    const db = new Database(dbPath, {
      readonly: false,
      fileMustExist: false,
      timeout: 10000,
    })

    try { db.pragma('journal_mode = WAL') } catch {}
    try { db.pragma('busy_timeout = 10000') } catch {}
    try { db.pragma('foreign_keys = ON') } catch {}

    if (process.env.NODE_ENV !== 'production') {
      globalForDb.sqlite = db
    }

    return db
  } catch (initError) {
    console.error('DB init error:', initError)
    throw initError
  }
}

let _db: Database.Database | null = null

function getDb(): Database.Database {
  if (!_db) {
    _db = initDb()
  }
  return _db
}

export interface QueryResult {
  lastInsertRowid: number | bigint
  changes: number
}

function normalizeParams(params?: Record<string, unknown> | unknown[]): unknown[] | undefined {
  if (params === undefined || params === null) return undefined
  if (Array.isArray(params)) return params.length > 0 ? params : undefined
  return undefined
}

export function query<T = Record<string, unknown>>(sql: string, params?: Record<string, unknown> | unknown[]): T[] {
  try {
    const db = getDb()
    const stmt = db.prepare(sql)
    const p = normalizeParams(params)
    if (p && p.length > 0) {
      return stmt.all(...p) as T[]
    }
    return stmt.all() as T[]
  } catch (error) {
    console.error('DB query error:', error)
    return []
  }
}

export function queryOne<T = Record<string, unknown>>(sql: string, params?: Record<string, unknown> | unknown[]): T | null {
  try {
    const db = getDb()
    const stmt = db.prepare(sql)
    const p = normalizeParams(params)
    if (p && p.length > 0) {
      return stmt.get(...p) as T ?? null
    }
    return stmt.get() as T ?? null
  } catch (error) {
    console.error('DB queryOne error:', error)
    return null
  }
}

export function execute(sql: string, params?: Record<string, unknown> | unknown[]): QueryResult {
  try {
    const db = getDb()
    const stmt = db.prepare(sql)
    const p = normalizeParams(params)
    let result: Database.RunResult
    if (p && p.length > 0) {
      result = stmt.run(...p)
    } else {
      result = stmt.run()
    }
    return {
      lastInsertRowid: result.lastInsertRowid,
      changes: result.changes,
    }
  } catch (error) {
    console.error('DB execute error:', error)
    return { lastInsertRowid: 0, changes: 0 }
  }
}

export function transaction<T>(fn: () => T): T {
  const db = getDb()
  const txn = db.transaction(fn)
  return txn()
}

export function count(table: string, where?: string, params?: Record<string, unknown> | unknown[]): number {
  const sql = where
    ? `SELECT COUNT(*) as cnt FROM ${table} WHERE ${where}`
    : `SELECT COUNT(*) as cnt FROM ${table}`
  const result = queryOne<{ cnt: number }>(sql, params)
  return result?.cnt ?? 0
}

export function getDbInstance(): Database.Database {
  return getDb()
}

export default getDb
