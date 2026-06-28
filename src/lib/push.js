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

/** Czytelny komunikat z wyjątku push (UI). */
export function describePushClientError(err) {
  if (!err) return 'Nie udało się zmienić powiadomień.'
  if (err.status === 401) return 'Sesja wygasła — odśwież stronę i zaloguj się ponownie.'
  if (err.code === 'push_not_configured') return 'Serwer nie ma skonfigurowanych kluczy push.'
  if (err.code === 'invalid_subscription') return 'Nieprawidłowa subskrypcja push — spróbuj ponownie.'
  if (err.code === 'push_db_error') return 'Błąd bazy danych push. Sprawdź migrację 0023.'
  const name = err.name || ''
  const msg = String(err.message || '')
  if (name === 'NotAllowedError' || msg.includes('denied')) {
    return 'Przeglądarka zablokowała powiadomienia. Włącz je w ustawieniach strony.'
  }
  if (msg.includes('applicationServerKey') || msg.includes('InvalidAccessError')) {
    return 'Nieprawidłowy klucz VAPID na serwerze — wygeneruj parę ponownie (npx @pushforge/builder vapid).'
  }
  if (msg.includes('ServiceWorker') || msg.includes('service worker')) {
    return 'Nie udało się zarejestrować service workera. Odśwież stronę i spróbuj ponownie.'
  }
  if (msg.includes('push service') || msg.includes('Registration failed')) {
    return 'Przeglądarka odrzuciła subskrypcję push. Sprawdź połączenie i ustawienia powiadomień.'
  }
  if (msg) return msg.length > 120 ? `${msg.slice(0, 117)}…` : msg
  return 'Nie udało się zmienić powiadomień.'
}

async function arrayBufferToBase64Url(buffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** Normalizuje PushSubscription do payloadu API (Chrome/Firefox różnią toJSON()). */
async function subscriptionToPayload(sub) {
  const json = sub.toJSON?.() ?? {}
  let p256dh = json.keys?.p256dh
  let auth = json.keys?.auth
  if ((!p256dh || !auth) && sub.getKey) {
    const p256dhBuf = await sub.getKey('p256dh')
    const authBuf = await sub.getKey('auth')
    if (p256dhBuf) p256dh = await arrayBufferToBase64Url(p256dhBuf)
    if (authBuf) auth = await arrayBufferToBase64Url(authBuf)
  }
  if (!json.endpoint || !p256dh || !auth) {
    throw new Error('invalid_subscription')
  }
  return { endpoint: json.endpoint, keys: { p256dh, auth } }
}

function isIOS() {
  if (typeof navigator === 'undefined') return false
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

function isStandalonePwa() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}

function hasPushManagerApi() {
  return (
    'PushManager' in window ||
    ('serviceWorker' in navigator &&
      typeof ServiceWorkerRegistration !== 'undefined' &&
      'pushManager' in ServiceWorkerRegistration.prototype)
  )
}

/**
 * Diagnostyka wsparcia Web Push w tej przeglądarce / kontekście.
 * @returns {{ supported: boolean, reason: 'ok'|'insecure'|'ios-install'|'unsupported', hint: string }}
 */
export function getPushSupportInfo() {
  if (typeof window === 'undefined') {
    return { supported: false, reason: 'unsupported', hint: '' }
  }
  if (!window.isSecureContext) {
    return {
      supported: false,
      reason: 'insecure',
      hint: 'Powiadomienia wymagają HTTPS. Otwórz https://homecashflow.org (nie http ani adres IP).',
    }
  }
  if (!('serviceWorker' in navigator) || !('Notification' in window)) {
    return {
      supported: false,
      reason: 'unsupported',
      hint: 'Ta przeglądarka nie obsługuje powiadomień push.',
    }
  }
  // iPhone/iPad: Chrome i Brave też używają WebKit — push tylko z ikony na ekranie (PWA).
  if (isIOS() && !isStandalonePwa()) {
    return {
      supported: false,
      reason: 'ios-install',
      hint:
        'Na iPhone/iPad: Safari → Udostępnij → Dodaj do ekranu początkowego. ' +
        'Potem otwórz HomeCashflow z ikony (nie z Safari) i włącz powiadomienia.',
    }
  }
  if (!hasPushManagerApi()) {
    return {
      supported: false,
      reason: 'unsupported',
      hint:
        'Brak Push API w tej przeglądarce. Na Androidzie użyj Chrome; ' +
        'na iPhone dodaj stronę do ekranu początkowego.',
    }
  }
  return { supported: true, reason: 'ok', hint: '' }
}

export function pushSupported() {
  return getPushSupportInfo().supported
}

async function ensureServiceWorker() {
  const reg = await navigator.serviceWorker.register(SW_URL, { scope: '/', updateViaCache: 'none' })
  await navigator.serviceWorker.ready
  if (!reg.active) {
    await new Promise((resolve) => {
      const sw = reg.installing || reg.waiting
      if (!sw) {
        resolve()
        return
      }
      sw.addEventListener('statechange', () => {
        if (sw.state === 'activated') resolve()
      })
    })
  }
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
  // Stara subskrypcja (inny klucz VAPID) blokuje nową — usuwamy i tworzymy od nowa.
  if (sub) {
    try {
      await sub.unsubscribe()
    } catch {
      /* ignore */
    }
    sub = null
  }
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    })
  }

  const payload = await subscriptionToPayload(sub)
  await savePushSubscribe({
    ...payload,
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
  if (!enabled) {
    try {
      const reg = await navigator.serviceWorker.getRegistration(SW_URL)
      const sub = reg ? await reg.pushManager.getSubscription() : null
      if (sub) await sub.unsubscribe()
    } catch {
      /* ignore */
    }
  }
  await savePushPreferences({ acPowerNotify: enabled })
}

export async function loadPushStatus() {
  const info = getPushSupportInfo()
  if (!info.supported) {
    return {
      configured: false,
      subscribed: false,
      acPowerNotify: false,
      supported: false,
      reason: info.reason,
      hint: info.hint,
    }
  }
  try {
    const status = await fetchPushStatus()
    if (status.dbError) {
      return {
        ...status,
        supported: true,
        reason: 'ok',
        hint: 'Błąd bazy push — uruchom migrację 0023 na serwerze.',
      }
    }
    return { ...status, supported: true, reason: 'ok', hint: '', permission: Notification.permission }
  } catch {
    return {
      configured: false,
      subscribed: false,
      acPowerNotify: false,
      supported: true,
      reason: 'ok',
      hint: '',
      permission: Notification.permission,
    }
  }
}
