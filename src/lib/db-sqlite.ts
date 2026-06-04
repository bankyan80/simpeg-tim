import Database from 'better-sqlite3'
import path from 'path'

// Global singleton for better-sqlite3
const globalForDb = globalThis as unknown as {
  sqlite: Database.Database | undefined
}

const DB_PATH = process.env.DATABASE_URL?.replace('file:', '') || path.join(process.cwd(), 'db', 'custom.db')

const sqlite = globalForDb.sqlite ?? new Database(DB_PATH, {
  readonly: false,
  fileMustExist: false,
  timeout: 10000,
})

// Enable WAL mode for better concurrency
sqlite.pragma('journal_mode = WAL')
sqlite.pragma('busy_timeout = 10000')
sqlite.pragma('foreign_keys = ON')

if (process.env.NODE_ENV !== 'production') globalForDb.sqlite = sqlite

// Helper types
export interface QueryResult {
  lastInsertRowid: number | bigint
  changes: number
}

// Normalize params to always be an array or undefined
function normalizeParams(params?: Record<string, unknown> | unknown[]): unknown[] | undefined {
  if (params === undefined || params === null) return undefined
  if (Array.isArray(params)) return params.length > 0 ? params : undefined
  // Object params - not supported, return undefined
  return undefined
}

// Query helper - for SELECT statements
export function query<T = Record<string, unknown>>(sql: string, params?: Record<string, unknown> | unknown[]): T[] {
  try {
    const stmt = sqlite.prepare(sql)
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

// Query one row
export function queryOne<T = Record<string, unknown>>(sql: string, params?: Record<string, unknown> | unknown[]): T | null {
  try {
    const stmt = sqlite.prepare(sql)
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

// Execute - for INSERT, UPDATE, DELETE
export function execute(sql: string, params?: Record<string, unknown> | unknown[]): QueryResult {
  try {
    const stmt = sqlite.prepare(sql)
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

// Transaction helper
export function transaction<T>(fn: () => T): T {
  const txn = sqlite.transaction(fn)
  return txn()
}

// Count helper
export function count(table: string, where?: string, params?: Record<string, unknown> | unknown[]): number {
  const sql = where
    ? `SELECT COUNT(*) as cnt FROM ${table} WHERE ${where}`
    : `SELECT COUNT(*) as cnt FROM ${table}`
  const result = queryOne<{ cnt: number }>(sql, params)
  return result?.cnt ?? 0
}

export { sqlite }
export default sqlite
