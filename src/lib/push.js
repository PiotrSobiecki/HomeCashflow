import {
  fetchPushStatus,
  fetchPushVapidPublicKey,
  savePushSubscribe,
  savePushUnsubscribe,
  savePushPreferences,
} from './api'

const SW_URL = '/sw.js'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

export function pushSupported() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

async function ensureServiceWorker() {
  const reg = await navigator.serviceWorker.register(SW_URL, { scope: '/' })
  await navigator.serviceWorker.ready
  return reg
}

/** @returns {Promise<PushSubscription|null>} */
async function getBrowserSubscription(reg) {
  return reg.pushManager.getSubscription()
}

/**
 * Włącza powiadomienia: permission → SW → subscribe → backend.
 * @returns {Promise<'granted'|'denied'|'unsupported'|'not_configured'|'error'>}
 */
export async function subscribeAcPowerPush({ acPowerNotify = true } = {}) {
  if (!pushSupported()) return 'unsupported'

  let publicKey
  try {
    ;({ publicKey } = await fetchPushVapidPublicKey())
  } catch (err) {
    if (err?.status === 503) return 'not_configured'
    throw err
  }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return 'denied'

  const reg = await ensureServiceWorker()
  let sub = await getBrowserSubscription(reg)
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    })
  }

  const json = sub.toJSON()
  await savePushSubscribe({
    endpoint: json.endpoint,
    keys: json.keys,
    acPowerNotify,
  })
  return 'granted'
}

export async function unsubscribeAcPowerPush() {
  if (!pushSupported()) return
  const reg = await navigator.serviceWorker.getRegistration(SW_URL)
  const sub = reg ? await reg.pushManager.getSubscription() : null
  if (sub) {
    const endpoint = sub.endpoint
    await sub.unsubscribe()
    await savePushUnsubscribe({ endpoint })
  } else {
    await savePushUnsubscribe()
  }
}

export async function setAcPowerPushPreference(enabled) {
  await savePushPreferences({ acPowerNotify: enabled })
}

export async function loadPushStatus() {
  if (!pushSupported()) {
    return { configured: false, subscribed: false, acPowerNotify: false, supported: false }
  }
  try {
    const status = await fetchPushStatus()
    return { ...status, supported: true, permission: Notification.permission }
  } catch {
    return {
      configured: false,
      subscribed: false,
      acPowerNotify: false,
      supported: true,
      permission: Notification.permission,
    }
  }
}
