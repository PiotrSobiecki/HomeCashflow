import { getDeviceStatus, formatStatuses } from './tuya/client.js'

/** Powyżej tego progu (W) uznajemy zestaw IR+klima za włączony (poniżej = standby). */
export const IR_PLUG_STANDBY_W = 20

/** Stan zasilania z poboru gniazdka (null = brak danych). */
export function acPowerOnFromPlugW(plugW) {
  if (plugW == null || !Number.isFinite(plugW)) return null
  return plugW > IR_PLUG_STANDBY_W
}

/** Nadpisuje power w stanie IR, gdy gniazdko wie lepiej (pilot fizyczny ≠ stan w chmurze). */
export function reconcileAcPower(ac, plugPowerOn) {
  if (plugPowerOn == null || !ac) return ac
  const power = plugPowerOn ? 1 : 0
  return ac.power === power ? ac : { ...ac, power }
}

/** Bieżący pobór [W] z powiązanego gniazdka Tuya. */
export async function readPlugPowerW(ctx, plugTuyaId) {
  if (!plugTuyaId) return null
  const f = formatStatuses(await getDeviceStatus(ctx, plugTuyaId))
  return f.powerW ?? 0
}
