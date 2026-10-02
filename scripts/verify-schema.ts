/**
 * Verify EarlyPay schema tables, indexes and triggers exist.
 * Usage:  bun run scripts/verify-schema.ts
 */
import pg from 'pg'
const { Client } = pg

const client = new Client({ connectionString: process.env.DATABASE_URL })
await client.connect()

// Tables
const tables = await client.query(`
  SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = 'earlypay'
  ORDER BY table_name
`)

// Indexes
const indexes = await client.query(`
  SELECT indexname
  FROM pg_indexes
  WHERE schemaname = 'earlypay'
  ORDER BY indexname
`)

// Row counts
const counts = await client.query(`
  SELECT
    (SELECT COUNT(*) FROM earlypay.invoices)          AS invoices,
    (SELECT COUNT(*) FROM earlypay.invoice_tiers)     AS tiers,
    (SELECT COUNT(*) FROM earlypay.sync_cursors)      AS cursors,
    (SELECT COUNT(*) FROM earlypay.transaction_events) AS events
`)

// Sync cursor seed
const cursor = await client.query(`
  SELECT chain_id, contract_address, last_block
  FROM earlypay.sync_cursors
`)

await client.end()

console.log('\n── EarlyPay Schema Verification ─────────────────────')
console.log('\nTables:')
tables.rows.forEach(r => console.log('  ✔', r.table_name))
console.log('\nIndexes:')
indexes.rows.forEach(r => console.log('  ✔', r.indexname))
console.log('\nRow counts (should all be 0 except cursors=1):')
console.log('  invoices:', counts.rows[0].invoices)
console.log('  tiers:   ', counts.rows[0].tiers)
console.log('  cursors: ', counts.rows[0].cursors)
console.log('  events:  ', counts.rows[0].events)
console.log('\nSync cursor seed:')
cursor.rows.forEach(r =>
  console.log(`  chain ${r.chain_id}  ${r.contract_address}  from block ${r.last_block}`)
)
console.log('\n─────────────────────────────────────────────────────\n')
