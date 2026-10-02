/**
 * EarlyPay database migration runner.
 * Reads DATABASE_URL from .env and executes scripts/migrate.sql.
 *
 * Usage:  bun run scripts/migrate.ts
 */
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import pg from 'pg'

const __dirname = dirname(fileURLToPath(import.meta.url))

const { Client } = pg

const url = process.env.DATABASE_URL
if (!url) {
  console.error('❌  DATABASE_URL is not set in .env')
  process.exit(1)
}

const sql = readFileSync(join(__dirname, 'migrate.sql'), 'utf8')

const client = new Client({ connectionString: url })

try {
  await client.connect()
  console.log('✔  Connected to database')

  await client.query(sql)
  console.log('✔  Migration applied — EarlyPay schema ready')
} catch (err) {
  console.error('❌  Migration failed:', (err as Error).message)
  process.exit(1)
} finally {
  await client.end()
}
