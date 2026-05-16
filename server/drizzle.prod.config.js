import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { defineConfig } from 'drizzle-kit'

// Tylko server/.env.production — żeby nie pomylić DATABASE_URL z devowym
const here = dirname(fileURLToPath(import.meta.url))
const result = dotenv.config({ path: join(here, '.env.production'), override: true })
if (result.error) {
  throw new Error(`Nie wczytano server/.env.production: ${result.error.message}`)
}

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL not set in server/.env.production')
}

export default defineConfig({
  schema: './src/db/schema.js',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL },
  strict: true,
  verbose: true,
})
