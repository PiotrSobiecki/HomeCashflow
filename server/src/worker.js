// Cloudflare Workers entrypoint
// Env bindings (DATABASE_URL, NEXTAUTH_SECRET, etc.) są dostępne jako c.env
// w handlerach Hono oraz jako `env` w handlerze `scheduled` (cron).
import { neon } from '@neondatabase/serverless'
import { app } from './app.js'
import { collectEnergySnapshots } from './smart-devices-sync.js'
import { fireDueTimers } from './device-timers.js'
import { decodeFinanceDataKey } from './finance-crypto.js'

export default {
  fetch: app.fetch,

  // Cron co minutę: wyłączniki czasowe IR (na bieżąco). Snapshot zużycia + retencja
  // tylko co 15 min (minuta % 15 == 0), żeby nie pollować urządzeń 15× częściej.
  async scheduled(event, env, ctx) {
    ctx.waitUntil((async () => {
      const sql = neon(env.DATABASE_URL)
      const rawKey = decodeFinanceDataKey(env.FINANCE_DATA_KEY)

      try {
        const t = await fireDueTimers(sql, rawKey)
        if (t.fired || t.failed) console.log('[cron] timers', t)
      } catch (err) {
        console.error('[cron] timers failed', err)
      }

      if (new Date(event.scheduledTime).getMinutes() % 15 === 0) {
        try {
          const res = await collectEnergySnapshots(sql, rawKey)
          await sql`DELETE FROM device_energy_snapshots WHERE recorded_at < NOW() - interval '400 days'`
          console.log('[cron] energy snapshots', res)
        } catch (err) {
          console.error('[cron] energy snapshots failed', err)
        }
      }
    })())
  },
}
