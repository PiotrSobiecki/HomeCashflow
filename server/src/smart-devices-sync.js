/**
 * Sync engine pomiarów energii (cron co 15 min).
 * Dla każdego aktywnego urządzenia odczytuje status z Tuya i zapisuje snapshot.
 * Urządzenie offline/błąd jest pomijane — runda leci dalej.
 */
import { decryptField } from './finance-crypto.js'
import { getTuyaToken, getDeviceStatus, formatStatuses } from './tuya/client.js'

/**
 * @param {import('@neondatabase/serverless').NeonQueryFunction} sql
 * @param {Uint8Array} rawKey — FINANCE_DATA_KEY do deszyfracji poświadczeń
 * @param {{ householdId?: string }} [opts] — opcjonalny scope do jednego gospodarstwa (cron: brak = wszystkie)
 * @returns {Promise<{ inserted: number, skipped: number }>}
 */
export async function collectEnergySnapshots(sql, rawKey, { householdId } = {}) {
  const devices = householdId
    ? await sql`
        SELECT sd.id, sd.tuya_device_id, sd.household_id,
               tc.client_id_enc, tc.client_secret_enc, tc.datacenter
        FROM smart_devices sd
        JOIN tuya_credentials tc ON tc.household_id = sd.household_id
        WHERE sd.is_active = true AND sd.household_id = ${householdId}
      `
    : await sql`
        SELECT sd.id, sd.tuya_device_id, sd.household_id,
               tc.client_id_enc, tc.client_secret_enc, tc.datacenter
        FROM smart_devices sd
        JOIN tuya_credentials tc ON tc.household_id = sd.household_id
        WHERE sd.is_active = true
      `

  // Token cache per gospodarstwo — jedno urządzenie offline nie psuje reszty.
  const ctxByHousehold = new Map()
  let inserted = 0
  let skipped = 0

  for (const d of devices) {
    try {
      let ctx = ctxByHousehold.get(d.household_id)
      if (!ctx) {
        const clientId = await decryptField(d.client_id_enc, rawKey)
        const clientSecret = await decryptField(d.client_secret_enc, rawKey)
        const { accessToken } = await getTuyaToken({ clientId, clientSecret, datacenter: d.datacenter })
        ctx = { clientId, clientSecret, datacenter: d.datacenter, accessToken }
        ctxByHousehold.set(d.household_id, ctx)
      }

      const raw = await getDeviceStatus(ctx, d.tuya_device_id)
      const f = formatStatuses(raw)

      await sql`
        INSERT INTO device_energy_snapshots (device_id, power_w, energy_kwh, switch_on, is_online)
        VALUES (${d.id}, ${f.powerW ?? null}, ${f.energyKwh ?? null}, ${f.switchOn ?? null}, true)
      `
      inserted++
    } catch (err) {
      console.error('[energy-sync] device skipped', d.tuya_device_id, err)
      skipped++
    }
  }

  return { inserted, skipped }
}
