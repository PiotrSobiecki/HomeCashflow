/**
 * Runner migracji Drizzle dla Neon.
 *   node src/db/migrate.js dev   # ładuje ../../.env.local
 *   node src/db/migrate.js prod  # ładuje ../../.env.production (server/.env.production)
 */
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { migrate } from 'drizzle-orm/neon-http/migrator'

const here = dirname(fileURLToPath(import.meta.url))
const serverDir = join(here, '..', '..')
const repoRoot = join(serverDir, '..')

const env = (process.argv[2] || '').toLowerCase()
if (env !== 'dev' && env !== 'prod' && env !== 'test') {
  console.error('Użycie: node src/db/migrate.js <dev|prod|test>')
  process.exit(1)
}

const envPath = env === 'prod'
  ? join(serverDir, '.env.production')
  : join(repoRoot, '.env.local')

const loaded = dotenv.config({ path: envPath, override: true })
if (loaded.error) {
  console.error(`Nie wczytano ${envPath}: ${loaded.error.message}`)
  process.exit(1)
}

// W trybie test używamy DATABASE_URL_TEST z .env.local (osobny Neon branch)
const url = (env === 'test' ? process.env.DATABASE_URL_TEST : process.env.DATABASE_URL)?.trim()
if (!/^postgres(ql)?:\/\//i.test(url || '')) {
  console.error('DATABASE_URL niepoprawny lub brak.')
  process.exit(1)
}

const dbHost = new URL(url).host
console.log(`Drizzle migrate [${env.toUpperCase()}] → ${dbHost}`)

if (env === 'prod') {
  console.log('⚠  PRODUKCJA. Migracja zacznie się za 3 sekundy. Ctrl+C aby przerwać.')
  await new Promise(r => setTimeout(r, 3000))
}

if (env === 'test' && !process.env.ALLOW_VITEST_DB_WIPE) {
  console.error('Tryb test wymaga ALLOW_VITEST_DB_WIPE=yes w .env.local (asercja że to test branch).')
  process.exit(1)
}

const sql = neon(url)
const db = drizzle(sql)

await migrate(db, { migrationsFolder: join(serverDir, 'drizzle') })
console.log('✓ Migracje Drizzle zaaplikowane.')
