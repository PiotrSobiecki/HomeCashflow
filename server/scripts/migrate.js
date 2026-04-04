import 'dotenv/config'
import { readFileSync } from 'fs'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)
const schema = readFileSync(new URL('../schema.sql', import.meta.url), 'utf-8')

const statements = schema
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0)

console.log(`Running ${statements.length} statements...`)
for (const stmt of statements) {
  await sql(stmt)
  console.log('  ✓', stmt.slice(0, 60).replace(/\n/g, ' '))
}
console.log('Migration complete.')
