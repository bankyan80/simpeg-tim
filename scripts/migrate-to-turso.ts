/**
 * Migration: copy all data from local SQLite to Turso
 * Run: bun run scripts/migrate-to-turso.ts
 */
import { createClient } from '@libsql/client'

const TABLE_ORDER = [
  'Sekolah',
  'Pengaturan',
  'User',
  'Pegawai',
  'RiwayatPendidikan',
  'RiwayatJabatan',
  'RiwayatPangkat',
  'RiwayatSertifikasi',
  'RiwayatMutasi',
  'RiwayatPelatihan',
  'DokumenPegawai',
  'AbsensiPegawai',
  'ValidasiData',
  'MutasiPegawai',
  'LogAktivitas',
]

async function main() {
  const dbUrl = process.env.TURSO_DATABASE_URL
  const dbToken = process.env.TURSO_AUTH_TOKEN

  if (!dbUrl || !dbToken) {
    console.error('TURSO_DATABASE_URL or TURSO_AUTH_TOKEN not set in .env')
    process.exit(1)
  }

  console.log('Connecting to local SQLite...')
  const local = createClient({ url: 'file:./db/custom.db' })

  console.log('Connecting to Turso...')
  const turso = createClient({ url: dbUrl, authToken: dbToken })

  const ping = await turso.execute("SELECT 1 as ok")
  console.log('  Connected:', ping.rows[0])

  // Remove FK constraints temporarily
  try { await turso.execute("PRAGMA foreign_keys = OFF") } catch {}

  // Get CREATE TABLE for each table in order
  const createStmts: { name: string; sql: string }[] = []
  for (const table of TABLE_ORDER) {
    const result = await local.execute(`SELECT sql FROM sqlite_master WHERE type='table' AND name='${table}'`)
    if (result.rows.length > 0) {
      createStmts.push({ name: table, sql: (result.rows[0] as Record<string, unknown>).sql as string })
    }
  }

  // Drop all tables in reverse order
  console.log('\nDropping existing tables...')
  for (const t of [...TABLE_ORDER].reverse()) {
    try { await turso.execute(`DROP TABLE IF EXISTS "${t}"`) } catch {}
  }

  // Create tables
  console.log('Creating tables...')
  for (const { name, sql } of createStmts) {
    try {
      await turso.execute(sql)
      console.log(`  ✓ ${name}`)
    } catch (err) {
      console.error(`  ✗ ${name}:`, err)
      process.exit(1)
    }
  }

  // Copy data in dependency order
  console.log('\nCopying data...')
  for (const table of TABLE_ORDER) {
    const rows = await local.execute(`SELECT * FROM "${table}"`)
    if (rows.rows.length === 0) {
      console.log(`  ${table}: 0 rows`)
      continue
    }

    const columns = rows.columns
    const placeholders = columns.map(() => '?').join(', ')
    const colNames = columns.map((c) => `"${c}"`).join(', ')

    const batchSize = 50
    let inserted = 0

    for (let i = 0; i < rows.rows.length; i += batchSize) {
      const batch = rows.rows.slice(i, i + batchSize)
      const tx = await turso.transaction('write')
      try {
        for (const row of batch) {
          const r = row as Record<string, unknown>
          const values = columns.map((c) => r[c] ?? null)
          await tx.execute({
            sql: `INSERT INTO "${table}" (${colNames}) VALUES (${placeholders})`,
            args: values,
          })
        }
        await tx.commit()
        inserted += batch.length
      } catch (err) {
        await tx.rollback()
        console.error(`  ✗ ${table} at row ${i}:`, err)
        throw err
      }
    }

    console.log(`  ✓ ${table}: ${inserted} rows`)
  }

  // Re-enable FK constraints
  try { await turso.execute("PRAGMA foreign_keys = ON") } catch {}

  // Verify
  console.log('\n--- Verification ---')
  for (const table of TABLE_ORDER) {
    const count = await turso.execute(`SELECT COUNT(*) as cnt FROM "${table}"`)
    console.log(`  ${table}: ${count.rows[0].cnt} rows`)
  }

  console.log('\n✅ Migration complete!')
}

main().catch((err) => {
  console.error('\nMigration failed:', err)
  process.exit(1)
})
