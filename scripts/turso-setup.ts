/**
 * Turso Database Setup Script
 *
 * This script creates a Turso database and migrates data from local SQLite.
 *
 * Prerequisites:
 *   1. Sign up at https://turso.tech (free tier)
 *   2. Generate an API token at https://turso.tech/account/tokens
 *   3. Set TURSO_API_TOKEN in environment
 *
 * Usage:
 *   TURSO_API_TOKEN=your_token bun run scripts/turso-setup.ts
 */

const TURSO_API_TOKEN = process.env.TURSO_API_TOKEN
const DB_NAME = process.env.TURSO_DB_NAME || 'simpeg-tim'

if (!TURSO_API_TOKEN) {
  console.error(`
ERROR: TURSO_API_TOKEN not set.

To set up Turso:
  1. Sign up at https://turso.tech (free tier, no credit card needed)
  2. Go to https://turso.tech/account/tokens
  3. Create a new API token
  4. Run: $env:TURSO_API_TOKEN="your_token" ; bun run scripts/turso-setup.ts

Or do it manually:
  1. Install Turso CLI via WSL or use the web dashboard
  2. Create a database: turso db create simpeg-tim
  3. Get the URL and token: turso db show simpeg-tim --url && turso db tokens create simpeg-tim
`)
  process.exit(1)
}

async function main() {
  const API = 'https://api.turso.tech/v1'

  // Find or create organization
  console.log('Looking up your Turso organization...')
  const orgsRes = await fetch(`${API}/organizations`, {
    headers: { Authorization: `Bearer ${TURSO_API_TOKEN}` },
  })
  const orgs = await orgsRes.json()
  const orgSlug = orgs?.data?.[0]?.slug

  if (!orgSlug) {
    console.error('No Turso organization found. Create one at https://turso.tech')
    process.exit(1)
  }
  console.log(`  Organization: ${orgSlug}`)

  // Check if database already exists
  console.log(`\nChecking if database "${DB_NAME}" exists...`)
  const listRes = await fetch(`${API}/organizations/${orgSlug}/databases`, {
    headers: { Authorization: `Bearer ${TURSO_API_TOKEN}` },
  })
  const list = await listRes.json()
  const existing = list?.databases?.find((d: { Name: string }) => d.Name === DB_NAME)

  let dbUrl: string
  let dbToken: string

  if (existing) {
    console.log(`  Database "${DB_NAME}" already exists`)
    dbUrl = `libsql://${DB_NAME}-${orgSlug}.turso.io`

    // Get auth token
    const tokenRes = await fetch(`${API}/organizations/${orgSlug}/databases/${DB_NAME}/auth/tokens`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${TURSO_API_TOKEN}` },
    })
    const tokenData = await tokenRes.json()
    dbToken = tokenData?.jwt || ''
  } else {
    // Create database
    console.log(`\nCreating database "${DB_NAME}"...`)
    const createRes = await fetch(`${API}/organizations/${orgSlug}/databases`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TURSO_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: DB_NAME,
        group: 'default',
      }),
    })
    const created = await createRes.json()
    dbUrl = created?.database?.Hostname
      ? `libsql://${created.database.Hostname}`
      : `libsql://${DB_NAME}-${orgSlug}.turso.io`

    // Get auth token
    const tokenRes = await fetch(`${API}/organizations/${orgSlug}/databases/${DB_NAME}/auth/tokens`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${TURSO_API_TOKEN}` },
    })
    const tokenData = await tokenRes.json()
    dbToken = tokenData?.jwt || ''

    console.log(`  Database created: ${dbUrl}`)
  }

  // Output credentials
  console.log('\n========================================')
  console.log('TURSO DATABASE CREDENTIALS')
  console.log('========================================')
  console.log(`TURSO_DATABASE_URL=${dbUrl}`)
  console.log(`TURSO_AUTH_TOKEN=${dbToken}`)
  console.log('========================================')

  // Run migration from SQLite to Turso
  console.log('\n\nRunning data migration...')
  const { execSync } = await import('child_process')
  try {
    execSync(
      `bun run scripts/migrate-to-turso.ts`,
      {
        env: {
          ...process.env,
          TURSO_DATABASE_URL: dbUrl,
          TURSO_AUTH_TOKEN: dbToken,
        },
        stdio: 'inherit',
      }
    )
  } catch {
    console.error('Migration failed. Run it manually after setup.')
  }

  console.log('\n✅ Turso setup complete!')
  console.log('\nAdd these to your Vercel environment variables:')
  console.log(`  TURSO_DATABASE_URL=${dbUrl}`)
  console.log(`  TURSO_AUTH_TOKEN=${dbToken}`)
  console.log('\nOr set them in your .env file for local testing:')
  console.log(`TURSO_DATABASE_URL=${dbUrl}`)
  console.log(`TURSO_AUTH_TOKEN=${dbToken}`)
}

main().catch((err) => {
  console.error('Setup failed:', err)
  process.exit(1)
})
