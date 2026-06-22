// Cloudflare Workers entrypoint
// Env bindings (DATABASE_URL, NEXTAUTH_SECRET, etc.) są dostępne jako c.env
// w handlerach Hono oraz jako `env` w handlerze `scheduled` (cron).
import { neon } from '@neondatabase/serverless'
import { app } from './app.js'
import { collectEnergySnapshots } from './smart-devices-sync.js'
import { fireDueTimers } from './device-timers.js'
import { decodeFinanceDataKey } from './finance-crypto.js'
import { refreshExpiringTokens } from './smartthings/credentials.js'
import { runAcThermostats } from './ac-thermostat.js'
import { getOutdoorTemp } from './weather.js'

export default {
  fetch: app.fetch,

  // Cron co 5 min: wyłączniki czasowe IR (±5 min — krok suwaka to i tak 30 min).
  // Snapshot zużycia + retencja tylko co 15 min (minuta % 15 == 0).
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

      if (new Date(event.scheduledTime).getUTCMinutes() % 15 === 0) {
        try {
          const res = await collectEnergySnapshots(sql, rawKey)
          await sql`DELETE FROM device_energy_snapshots WHERE recorded_at < NOW() - interval '400 days'`
          console.log('[cron] energy snapshots', res)
        } catch (err) {
          console.error('[cron] energy snapshots failed', err)
        }
      }

      // Termostat zewnętrzny klimy IR: sprawdzanie temperatury co 30 min (minuta % 30).
      if (new Date(event.scheduledTime).getUTCMinutes() % 30 === 0) {
        try {
          const res = await runAcThermostats(sql, rawKey, { readOutdoorTemp: getOutdoorTemp })
          if (res.checked || res.switched || res.failed) console.log('[cron] ac thermostats', res)
        } catch (err) {
          console.error('[cron] ac thermostats failed', err)
        }
      }

      // SmartThings: odświeżanie tokenów ~co 12h (cron leci co 5 min).
      const st = new Date(event.scheduledTime)
      if (st.getHours() % 12 === 0 && st.getMinutes() < 5) {
        try {
          const res = await refreshExpiringTokens(sql, {
            clientId: env.SMARTTHINGS_CLIENT_ID,
            clientSecret: env.SMARTTHINGS_CLIENT_SECRET,
            rawKey,
          })
          if (res.due) console.log('[cron] smartthings tokens', res)
        } catch (err) {
          console.error('[cron] smartthings refresh failed', err)
        }
      }
    })())
  },
}
