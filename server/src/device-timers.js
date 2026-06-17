/**
 * Wyłącznik czasowy dla urządzeń IR (Smart IR). Cron co minutę woła fireDueTimers:
 * dla każdego timera, któremu minął `fire_at`, wysyła wyłączenie i oznacza wpis jako done.
 *
 * IR nie ma natywnego countdownu — pilot nie zna stanu urządzenia:
 *  • klima (`ir_ac`)   → jawne `power=0` (pewne wyłączenie),
 *  • pilot (`ir_remote`) → klawisz „Power" (TOGGLE — wyłączy włączone, ale włączy wyłączone).
 */
import { decryptField } from './finance-crypto.js'
import {
  getTuyaToken, sendAcCommand, getRemoteKeys, sendRemoteKey,
  getDeviceStatus, formatStatuses,
} from './tuya/client.js'

// Próg standby — pilot powiązany z gniazdkiem nie wyśle „off", gdy pobór poniżej (zestaw już zgaszony).
const IR_PLUG_STANDBY_W = 10

/** Znajduje klawisz zasilania w liście pilota (po `key`/`key_name`). */
function findPowerKey(keyList) {
  return (keyList ?? []).find((k) => /power/i.test(k.key) || /power/i.test(k.key_name)) || null
}

/**
 * Wykonuje należne timery (fire_at <= now). Token Tuya cache'owany per gospodarstwo.
 * @param {import('@neondatabase/serverless').NeonQueryFunction} sql
 * @param {Uint8Array} rawKey — FINANCE_DATA_KEY do deszyfracji poświadczeń
 * @returns {Promise<{ fired: number, failed: number }>}
 */
export async function fireDueTimers(sql, rawKey) {
  const due = await sql`
    SELECT t.id, t.device_id, t.household_id,
           sd.tuya_device_id, sd.device_type, sd.ir_parent_id, sd.linked_plug_id,
           plug.tuya_device_id AS plug_tuya_id,
           tc.client_id_enc, tc.client_secret_enc, tc.datacenter
    FROM device_timers t
    JOIN smart_devices sd ON sd.id = t.device_id
    LEFT JOIN smart_devices plug ON plug.id = sd.linked_plug_id
    JOIN tuya_credentials tc ON tc.household_id = t.household_id
    WHERE t.status = 'pending' AND t.fire_at <= NOW()
    ORDER BY t.fire_at ASC
  `

  const ctxByHousehold = new Map()
  let fired = 0
  let failed = 0

  for (const d of due) {
    try {
      let ctx = ctxByHousehold.get(d.household_id)
      if (!ctx) {
        const clientId = await decryptField(d.client_id_enc, rawKey)
        const clientSecret = await decryptField(d.client_secret_enc, rawKey)
        const { accessToken } = await getTuyaToken({ clientId, clientSecret, datacenter: d.datacenter })
        ctx = { clientId, clientSecret, datacenter: d.datacenter, accessToken }
        ctxByHousehold.set(d.household_id, ctx)
      }

      if (d.device_type === 'ir_ac') {
        await sendAcCommand(ctx, d.ir_parent_id, d.tuya_device_id, 'power', 0)
      } else if (d.device_type === 'ir_remote') {
        // Bezpieczny toggle: jeśli pilot powiązany z gniazdkiem i pobór ≤ standby,
        // zestaw jest już zgaszony — nie wysyłamy „power" (toggle by go WŁĄCZYŁ).
        if (d.plug_tuya_id) {
          const f = formatStatuses(await getDeviceStatus(ctx, d.plug_tuya_id))
          if ((f.powerW ?? 0) <= IR_PLUG_STANDBY_W) {
            await sql`UPDATE device_timers SET status = 'done' WHERE id = ${d.id}`
            fired++
            continue
          }
        }
        const r = await getRemoteKeys(ctx, d.ir_parent_id, d.tuya_device_id)
        const powerKey = findPowerKey(r?.key_list)
        if (!powerKey) throw new Error('no power key on remote')
        await sendRemoteKey(ctx, d.ir_parent_id, d.tuya_device_id, {
          categoryId: r?.category_id ?? null, key: powerKey.key, keyId: powerKey.key_id ?? null,
        })
      } else {
        throw new Error(`unsupported device_type for timer: ${d.device_type}`)
      }

      await sql`UPDATE device_timers SET status = 'done' WHERE id = ${d.id}`
      fired++
    } catch (err) {
      console.error('[timers] fire failed', d.tuya_device_id, err)
      await sql`UPDATE device_timers SET status = 'failed' WHERE id = ${d.id}`
      failed++
    }
  }

  return { fired, failed }
}
