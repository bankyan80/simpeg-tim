import { createClient } from '@libsql/client'
import type { Client, ResultSet } from '@libsql/client'
import path from 'path'
import fs from 'fs'

const globalForTurso = globalThis as unknown as {
  client: Client | undefined
}

function getDbUrl(): string {
  const envUrl = process.env.TURSO_DATABASE_URL
  if (envUrl) return envUrl

  if (process.env.VERCEL) {
    const original = path.join(process.cwd(), 'db', 'custom.db')
    const tmpPath = path.join('/tmp', 'custom.db')
    if (!fs.existsSync(tmpPath) && fs.existsSync(original)) {
      fs.copyFileSync(original, tmpPath)
    }
    return `file:${tmpPath}`
  }

  return 'file:./db/custom.db'
}

function initClient(): Client {
  const existing = globalForTurso.client
  if (existing) return existing

  const url = getDbUrl()
  const isRemote = url.startsWith('libsql://') || url.startsWith('https://')

  const client = createClient({
    url,
    authToken: isRemote ? process.env.TURSO_AUTH_TOKEN : undefined,
  })

  if (process.env.NODE_ENV !== 'production') {
    globalForTurso.client = client
  }

  return client
}

let _client: Client | null = null

function getClient(): Client {
  if (!_client) {
    _client = initClient()
  }
  return _client
}

export interface QueryResult {
  lastInsertRowid: number | bigint
  changes: number
}

export async function query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]> {
  try {
    const client = getClient()
    const result = await client.execute({ sql, args: params ?? [] })
    return result.rows as unknown as T[]
  } catch (error) {
    console.error('DB query error:', error)
    return []
  }
}

export async function queryOne<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T | null> {
  try {
    const client = getClient()
    const result = await client.execute({ sql, args: params ?? [] })
    if (result.rows.length === 0) return null
    return result.rows[0] as unknown as T
  } catch (error) {
    console.error('DB queryOne error:', error)
    return null
  }
}

export async function execute(sql: string, params?: unknown[]): Promise<QueryResult> {
  try {
    const client = getClient()
    const result = await client.execute({ sql, args: params ?? [] })
    const rid = result.lastInsertRowid
    const lastInsertRowid = rid !== undefined ? (typeof rid === 'string' ? parseInt(rid, 10) || 0 : Number(rid)) : 0
    return {
      lastInsertRowid,
      changes: result.rowsAffected,
    }
  } catch (error) {
    console.error('DB execute error:', error)
    return { lastInsertRowid: 0, changes: 0 }
  }
}

export async function count(table: string, where?: string, params?: unknown[]): Promise<number> {
  const sql = where
    ? `SELECT COUNT(*) as cnt FROM ${table} WHERE ${where}`
    : `SELECT COUNT(*) as cnt FROM ${table}`
  const result = await queryOne<{ cnt: number }>(sql, params)
  return result?.cnt ?? 0
}

export function getClientInstance(): Client {
  return getClient()
}

export default getClient
