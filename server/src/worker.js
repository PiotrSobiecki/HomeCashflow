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
import { notifyHouseholdAcPower, notifyHouseholdCycleComplete, notifyHouseholdPlugPower } from './push.js'
import { pollCycleDevices } from './device-notifications.js'
import { syncBankConnections } from './bank-sync.js'

export default {
  fetch: app.fetch,

  // Cron co 15 min: timery IR, poll cyklu AGD, snapshoty energii.
  // Termostat klimy co 30 min; tokeny ST ~co 12h.
  async scheduled(event, env, ctx) {
    ctx.waitUntil((async () => {
      const sql = neon(env.DATABASE_URL)
      const rawKey = decodeFinanceDataKey(env.FINANCE_DATA_KEY)
      const notifyAcPower = (payload) => notifyHouseholdAcPower(sql, env, payload)
      const notifyCycleComplete = (payload) => notifyHouseholdCycleComplete(sql, env, payload)
      const notifyPlugPower = (payload) => notifyHouseholdPlugPower(sql, env, payload)
      const minute = new Date(event.scheduledTime).getUTCMinutes()

      try {
        const t = await fireDueTimers(sql, rawKey, { notifyAcPower })
        if (t.fired || t.failed) console.log('[cron] timers', t)
      } catch (err) {
        console.error('[cron] timers failed', err)
      }

      try {
        const c = await pollCycleDevices(sql, rawKey, {
          clientId: env.SMARTTHINGS_CLIENT_ID,
          clientSecret: env.SMARTTHINGS_CLIENT_SECRET,
          notifyCycleComplete,
        })
        if (c.checked || c.notified || c.failed) console.log('[cron] cycle devices', c)
      } catch (err) {
        console.error('[cron] cycle devices failed', err)
      }

      // Snapshoty energii + retencja — przy cronie */15 lecą na każdym ticku.
      try {
        const res = await collectEnergySnapshots(sql, rawKey, { notifyPlugPower })
        await sql`DELETE FROM device_energy_snapshots WHERE recorded_at < NOW() - interval '400 days'`
        console.log('[cron] energy snapshots', res)
      } catch (err) {
        console.error('[cron] energy snapshots failed', err)
      }

      // Termostat zewnętrzny klimy IR: co 30 min (:00 i :30).
      if (minute % 30 === 0) {
        try {
          const res = await runAcThermostats(sql, rawKey, {
            readOutdoorTemp: (coords) => getOutdoorTemp(coords, { apiKey: env.WEATHER_GOOGLE_API_KEY }),
            notifyAcPower,
          })
          if (res.checked || res.switched || res.failed) console.log('[cron] ac thermostats', res)
        } catch (err) {
          console.error('[cron] ac thermostats failed', err)
        }
      }

      // Bank (Enable Banking): co 6 h (:00 o 0/6/12/18) — PSD2 pozwala na
      // 4 odpytania/dobę bez obecności usera, więcej ticków = błędy z banku.
      const bankHour = new Date(event.scheduledTime).getUTCHours()
      if (minute === 0 && bankHour % 6 === 0) {
        try {
          const res = await syncBankConnections(sql, rawKey, env)
          if (res.connections) console.log('[cron] bank sync', res)
        } catch (err) {
          console.error('[cron] bank sync failed', err)
        }
      }

      // SmartThings: odświeżanie tokenów ~co 12h (tick o :00).
      const st = new Date(event.scheduledTime)
      if (st.getHours() % 12 === 0 && st.getMinutes() === 0) {
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
