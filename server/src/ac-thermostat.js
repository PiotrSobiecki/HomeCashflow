import { decryptField } from './finance-crypto.js'
import { getTuyaToken, sendAcCommand, getAcStatus, formatAcStatus } from './tuya/client.js'

/**
 * Termostat zewnętrzny dla klimy IR (Tuya `ir_ac`).
 *
 * `decide` to czysta funkcja decyzyjna z histerezą dwuprogową i edge-triggerem:
 * zwraca komendę do wysłania tylko gdy temperatura zewnętrzna realnie przekroczy próg
 * **i** docelowy stan różni się od bieżącego zasilania klimy (jeśli znane z Tuya).
 * W strefie martwej nie rusza klimy, by nie nadpisywać ręcznych zmian użytkownika.
 *
/**
 * @param {{ temp:number, tempOn:number, tempOff:number, lastAction:('on'|'off'|null), acPowerOn:(boolean|null), mode?:('cool'|'heat') }} args
 * @returns {'on' | 'off' | null}
 */
export function decide({ temp, tempOn, tempOff, lastAction, acPowerOn = null, mode = 'cool' }) {
  let desired = null
  if (mode === 'heat') {
    if (temp <= tempOn) desired = 'on'
    else if (temp >= tempOff) desired = 'off'
  } else {
    if (temp >= tempOn) desired = 'on'
    else if (temp <= tempOff) desired = 'off'
  }

  if (desired === null) return null

  // Preferujemy rzeczywisty stan z Tuya (ten sam co front „Włączona/Wyłączona”).
  const current =
    acPowerOn === true ? 'on'
      : acPowerOn === false ? 'off'
        : lastAction

  if (desired === current) return null
  return desired
}

/**
 * Runner crona (co 30 min): dla każdego włączonego termostatu odczytuje temperaturę
 * zewnętrzną, woła `decide()` i — jeśli trzeba — wysyła power do klimy IR. Token Tuya
 * cache'owany per gospodarstwo (jak `fireDueTimers`). Błąd pogody/Tuya dla wpisu →
 * log + pominięcie, bez zmiany stanu klimy.
 *
 * Źródło temperatury jest wstrzykiwane (`readOutdoorTemp`) — to granica „dostawca pogody".
 * W Fazie 1 wstrzykujemy fake; w Fazie 2 realne Open-Meteo.
 *
 * @param {import('@neondatabase/serverless').NeonQueryFunction} sql
 * @param {Uint8Array} rawKey — FINANCE_DATA_KEY do deszyfracji poświadczeń Tuya
 * @param {{ readOutdoorTemp: (coords:{lat:number,lon:number}) => Promise<number|null> }} deps
 * @returns {Promise<{ checked:number, switched:number, failed:number }>}
 */
export async function runAcThermostats(sql, rawKey, { readOutdoorTemp }) {
  const rows = await sql`
    SELECT th.id, th.household_id, th.device_id, th.lat, th.lon,
           th.climate_mode, th.temp_on, th.temp_off, th.last_action,
           sd.tuya_device_id, sd.ir_parent_id,
           tc.client_id_enc, tc.client_secret_enc, tc.datacenter
    FROM ac_thermostats th
    JOIN smart_devices sd ON sd.id = th.device_id
    JOIN tuya_credentials tc ON tc.household_id = th.household_id
    WHERE th.enabled = true AND sd.device_type = 'ir_ac'
  `

  const ctxByHousehold = new Map()
  let checked = 0
  let switched = 0
  let failed = 0

  for (const r of rows) {
    try {
      const temp = await readOutdoorTemp({ lat: Number(r.lat), lon: Number(r.lon) })
      if (temp == null || !Number.isFinite(temp)) {
        // Brak danych pogodowych → nie ruszamy klimy (PRD: pomijamy cykl).
        failed++
        continue
      }

      let ctx = ctxByHousehold.get(r.household_id)
      if (!ctx) {
        const clientId = await decryptField(r.client_id_enc, rawKey)
        const clientSecret = await decryptField(r.client_secret_enc, rawKey)
        const { accessToken } = await getTuyaToken({ clientId, clientSecret, datacenter: r.datacenter })
        ctx = { clientId, clientSecret, datacenter: r.datacenter, accessToken }
        ctxByHousehold.set(r.household_id, ctx)
      }

      let acPowerOn = null
      try {
        const ac = formatAcStatus(await getAcStatus(ctx, r.ir_parent_id, r.tuya_device_id))
        if (ac.power === 1) acPowerOn = true
        else if (ac.power === 0) acPowerOn = false
      } catch (err) {
        console.warn('[ac-thermostat] AC status read failed, falling back to last_action', r.tuya_device_id, err)
      }

      const action = decide({
        temp,
        tempOn: Number(r.temp_on),
        tempOff: Number(r.temp_off),
        lastAction: r.last_action,
        acPowerOn,
        mode: r.climate_mode === 'heat' ? 'heat' : 'cool',
      })

      if (action) {
        await sendAcCommand(ctx, r.ir_parent_id, r.tuya_device_id, 'power', action === 'on' ? 1 : 0)
        await sql`
          UPDATE ac_thermostats
          SET last_action = ${action}, last_outdoor_temp = ${temp}, last_checked_at = NOW()
          WHERE id = ${r.id}
        `
        switched++
      } else {
        // Strefa martwa / stan już osiągnięty: zapisujemy że sprawdziliśmy, klimy nie ruszamy.
        await sql`
          UPDATE ac_thermostats
          SET last_outdoor_temp = ${temp}, last_checked_at = NOW()
          WHERE id = ${r.id}
        `
      }
      checked++
    } catch (err) {
      console.error('[ac-thermostat] check failed', r.tuya_device_id, err)
      failed++
    }
  }

  return { checked, switched, failed }
}

/** Min. odstęp między progami (°C) — cool: tempOn > tempOff; heat: tempOff > tempOn. */
export function thermostatThresholdGap(mode, tempOn, tempOff) {
  return mode === 'heat' ? tempOff - tempOn : tempOn - tempOff
}
