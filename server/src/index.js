import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { serve } from '@hono/node-server'

// Kolejność: root → root .env.local → server/.env → server/.env.local (późniejsze nadpisuje).
const serverSrcDir = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(serverSrcDir, '../..')
const serverRoot = join(serverSrcDir, '..')
const loadEnv = (dir, name) => dotenv.config({ path: join(dir, name), override: true })
loadEnv(repoRoot, '.env')
loadEnv(repoRoot, '.env.local')
loadEnv(serverRoot, '.env')
loadEnv(serverRoot, '.env.local')

import { app } from './app.js'

const port = process.env.PORT || 3000

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Server running at http://localhost:${info.port}`)
})
