/**
 * Jednorazowo: ALTER finance_data.data JSONB → TEXT (pod szyfrowanie ff1:).
 *
 * Domyślnie: ładuje ../../.env oraz ../.env (dev).
 * Produkcja:  node scripts/run-migration-001.js --production
 *   → tylko server/.env.production (żeby nie pomylić z dev DATABASE_URL).
 */
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { neon } from '@neondatabase/serverless'

const serverDir = join(dirname(fileURLToPath(import.meta.url)), '..')
const root = join(serverDir, '..')
const args = process.argv.slice(2)
const useProduction = args.includes('--production')

if (useProduction) {
  const prodPath = join(serverDir, '.env.production')
  const result = dotenv.config({ path: prodPath })
  if (result.error) {
    console.error(`Nie wczytano ${prodPath}:`, result.error.message)
    process.exit(1)
  }
} else {
  dotenv.config({ path: join(root, '.env') })
  dotenv.config({ path: join(serverDir, '.env') })
}

function normalizeDatabaseUrl(raw) {
  const s = raw?.trim() ?? ''
  if (/^postgres(ql)?:\/\//i.test(s)) return s
  if (/^psql\s+/i.test(s)) {
    const q1 = s.indexOf("'")
    if (q1 !== -1) {
      const q2 = s.indexOf("'", q1 + 1)
      if (q2 !== -1) return s.slice(q1 + 1, q2).trim()
    }
    const d1 = s.indexOf('"')
    if (d1 !== -1) {
      const d2 = s.indexOf('"', d1 + 1)
      if (d2 !== -1) return s.slice(d1 + 1, d2).trim()
    }
  }
  return s
}

const raw = normalizeDatabaseUrl(process.env.DATABASE_URL)
if (!/^postgres(ql)?:\/\//i.test(raw)) {
  console.error(
    'DATABASE_URL musi być pełnym URL postgresql://… (w .env bez komendy psql albo w cudzysłowie po psql).',
  )
  process.exit(1)
}

const sql = neon(raw)
await sql(
  'ALTER TABLE finance_data ALTER COLUMN data SET DATA TYPE TEXT USING (data::text)',
  [],
)
console.log('Migracja 001 (finance_data.data → TEXT) wykonana pomyślnie.')
