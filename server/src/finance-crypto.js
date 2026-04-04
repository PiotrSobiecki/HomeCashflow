/**
 * Szyfrowanie finance_data przed zapisem do bazy (AES-256-GCM).
 * Wiersz w kolumnie `data` (TEXT): prefiks `ff1:` + Base64(IV || ciphertext+tag).
 *
 * FINANCE_DATA_KEY: 32 bajty jako hex (64 znaki) lub Base64 (standardowy).
 */

const PREFIX = 'ff1:'

function hexToBytes(hex) {
  const len = hex.length / 2
  const out = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }
  return out
}

function base64ToBytes(b64) {
  const normalized = b64.replace(/-/g, '+').replace(/_/g, '/')
  const pad = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4))
  const bin = atob(normalized + pad)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

function bytesToBase64(bytes) {
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + chunk, bytes.length)))
  }
  return btoa(binary)
}

/** @returns {Uint8Array | null} */
export function decodeFinanceDataKey(secret) {
  if (!secret || typeof secret !== 'string') return null
  const s = secret.trim()
  if (/^[0-9a-fA-F]{64}$/.test(s)) {
    return hexToBytes(s)
  }
  try {
    const bytes = base64ToBytes(s)
    if (bytes.length === 32) return bytes
  } catch {
    /* ignore */
  }
  return null
}

export async function encryptFinancePayload(plainJsonString, rawKey) {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    rawKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt'],
  )
  const cipherBuf = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    new TextEncoder().encode(plainJsonString),
  )
  const cipher = new Uint8Array(cipherBuf)
  const combined = new Uint8Array(iv.length + cipher.length)
  combined.set(iv, 0)
  combined.set(cipher, iv.length)
  return PREFIX + bytesToBase64(combined)
}

export async function decryptFinancePayload(stored, rawKey) {
  if (typeof stored !== 'string' || !stored.startsWith(PREFIX)) {
    throw new Error('Invalid encrypted finance payload')
  }
  const combined = base64ToBytes(stored.slice(PREFIX.length))
  if (combined.length < 12 + 16) throw new Error('Truncated encrypted finance payload')
  const iv = combined.subarray(0, 12)
  const ciphertext = combined.subarray(12)
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    rawKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt'],
  )
  const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, cryptoKey, ciphertext)
  return new TextDecoder().decode(plainBuf)
}

/**
 * @param {unknown} stored — z DB: string (TEXT / legacy JSON) lub obiekt (stary JSONB)
 * @param {Uint8Array | null} rawKey
 */
export async function parseStoredFinanceData(stored, rawKey) {
  if (stored == null || stored === '') return {}
  if (typeof stored === 'object' && stored !== null && !Array.isArray(stored)) {
    return /** @type {Record<string, unknown>} */ (stored)
  }
  const str = String(stored)
  if (str.startsWith(PREFIX)) {
    if (!rawKey) {
      throw new Error('FINANCE_DATA_KEY is required to read encrypted finance data')
    }
    const json = await decryptFinancePayload(str, rawKey)
    return JSON.parse(json)
  }
  try {
    const parsed = JSON.parse(str)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}
