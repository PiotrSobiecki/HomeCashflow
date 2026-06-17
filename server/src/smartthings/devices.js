/**
 * Czyste helpery do normalizacji odpowiedzi SmartThings REST API.
 * Ziarno przyszłego mappera capabilities (issue #41) — wyodrębnione już w spike (#38),
 * żeby skrypt drukujący urządzenia był testowalny bez sieci ani OAuth.
 *
 * @see https://developer.smartthings.com/docs/api/public#operation/getDevices
 */

// Capability cyklu AGD → typ urządzenia, do ikony i czytelnej etykiety.
const TYPE_BY_CAPABILITY = {
  washerOperatingState: 'washer',
  dryerOperatingState: 'dryer',
  dishwasherOperatingState: 'dishwasher',
}

/** Zbiera id capability ze wszystkich komponentów urządzenia ST. */
function capabilityIds(device) {
  const ids = []
  for (const component of device?.components ?? []) {
    for (const cap of component?.capabilities ?? []) {
      if (cap?.id) ids.push(cap.id)
    }
  }
  return ids
}

/** Wnioskuje typ urządzenia z capabilities; nieznane → 'other'. */
export function inferDeviceType(device) {
  const ids = capabilityIds(device)
  for (const id of ids) {
    if (TYPE_BY_CAPABILITY[id]) return TYPE_BY_CAPABILITY[id]
  }
  if (ids.includes('refrigeration')) return 'fridge'
  if (ids.includes('airConditionerMode')) return 'ac'
  if (ids.includes('tvChannel') || ids.includes('mediaInputSource')) return 'tv'
  return 'other'
}

/**
 * Normalizuje odpowiedź `GET /v1/devices` na zwięzłą listę do druku/wyboru.
 * @returns {Array<{ deviceId: string, label: string, type: string }>}
 */
export function summarizeDevices(response) {
  return (response?.items ?? []).map((device) => ({
    deviceId: device.deviceId,
    label: device.label ?? device.name ?? '(bez nazwy)',
    type: inferDeviceType(device),
  }))
}
