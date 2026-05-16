import 'dotenv/config'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { defineConfig } from 'drizzle-kit'

// Załaduj env devowy z root projektu (../.env.local), nadpisując ewentualne defaults
const here = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(here, '..', '.env.local'), override: true })

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL not loaded from ../.env.local')
}

export default defineConfig({
  schema: './src/db/schema.js',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL },
  strict: true,
  verbose: true,
})
