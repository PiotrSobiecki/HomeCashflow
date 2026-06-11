/**
 * Sync engine pomiarów energii (cron co 15 min). Dla każdego aktywnego urządzenia:
 *  1) snapshot mocy z cienia (power_w/switch — do wykresu mocy/szczytu, na żywo),
 *  2) zaciągnięcie z LOGÓW zdarzeń wszystkich paczek add_ele od ostatniej zapisanej
 *     i ich składowanie (energy_reported_at = event_time). Logi to jedyne dokładne
 *     źródło zużycia — pollowanie cienia gubi paczki (np. dwie 0.021 pod rząd).
 * Urządzenie offline/błąd jest pomijane — runda leci dalej.
 */
import { decryptField } from './finance-crypto.js'
import { getTuyaToken, getDeviceProperties, formatProperties, getAddEleEvents } from './tuya/client.js'

// Gdy urządzenie nie ma jeszcze żadnej zapisanej paczki — ile wstecz spróbować
// dociągnąć z logów (retencja Tuya i tak jest krótka, ~doba).
const BACKFILL_WINDOW_MS = 24 * 60 * 60 * 1000

/**
 * @param {import('@neondatabase/serverless').NeonQueryFunction} sql
 * @param {Uint8Array} rawKey — FINANCE_DATA_KEY do deszyfracji poświadczeń
 * @param {{ householdId?: string }} [opts] — opcjonalny scope do jednego gospodarstwa (cron: brak = wszystkie)
 * @returns {Promise<{ inserted: number, events: number, skipped: number }>}
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
  let events = 0
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

      // 1) Snapshot mocy na żywo (do wykresu mocy / szczytu). Energii z cienia NIE
      //    składujemy — jest niedokładna; energia idzie wyłącznie z logów (niżej).
      const f = formatProperties(await getDeviceProperties(ctx, d.tuya_device_id))
      await sql`
        INSERT INTO device_energy_snapshots (device_id, power_w, switch_on, is_online)
        VALUES (${d.id}, ${f.powerW ?? null}, ${f.switchOn ?? null}, true)
      `
      inserted++

      // 2) Paczki add_ele z logów od ostatniej zapisanej (event_time). Dedup po
      //    (device_id, energy_reported_at) — idempotentne między rundami.
      const [last] = await sql`
        SELECT max(energy_reported_at) AS m FROM device_energy_snapshots
        WHERE device_id = ${d.id} AND energy_reported_at IS NOT NULL
      `
      const startMs = last?.m ? new Date(last.m).getTime() + 1 : Date.now() - BACKFILL_WINDOW_MS
      const packets = await getAddEleEvents(ctx, d.tuya_device_id, { startMs, endMs: Date.now() })
      for (const p of packets) {
        const res = await sql`
          INSERT INTO device_energy_snapshots (device_id, energy_kwh, energy_reported_at)
          VALUES (${d.id}, ${p.kwh}, ${new Date(p.eventMs)})
          ON CONFLICT (device_id, energy_reported_at) WHERE energy_reported_at IS NOT NULL DO NOTHING
          RETURNING id
        `
        events += res.length
      }
    } catch (err) {
      console.error('[energy-sync] device skipped', d.tuya_device_id, err)
      skipped++
    }
  }

  return { inserted, events, skipped }
}
