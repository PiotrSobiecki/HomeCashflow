// Cloudflare Workers entrypoint
// Env bindings (DATABASE_URL, NEXTAUTH_SECRET, etc.) są dostępne jako c.env
// w handlerach Hono oraz jako `env` w handlerze `scheduled` (cron).
import { neon } from '@neondatabase/serverless'
import { app } from './app.js'
import { collectEnergySnapshots } from './smart-devices-sync.js'
import { decodeFinanceDataKey } from './finance-crypto.js'

export default {
  fetch: app.fetch,

  // Cron co 15 min — snapshot zużycia aktywnych urządzeń + retencja 400 dni.
  async scheduled(event, env, ctx) {
    ctx.waitUntil((async () => {
      try {
        const sql = neon(env.DATABASE_URL)
        const rawKey = decodeFinanceDataKey(env.FINANCE_DATA_KEY)
        const res = await collectEnergySnapshots(sql, rawKey)
        await sql`DELETE FROM device_energy_snapshots WHERE recorded_at < NOW() - interval '400 days'`
        console.log('[cron] energy snapshots', res)
      } catch (err) {
        console.error('[cron] energy snapshots failed', err)
      }
    })())
  },
}
