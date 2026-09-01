/**
 * Klient Enable Banking (open banking / PSD2 AIS).
 *
 * Autoryzacja do API: JWT RS256 podpisywany kluczem prywatnym aplikacji
 * (ENABLE_BANKING_PRIVATE_KEY, PEM PKCS#8 — dopuszczamy też base64(PEM) w jednej
 * linii, bo sekrety wielolinijkowe bywają upierdliwe), kid = ENABLE_BANKING_APP_ID.
 *
 * Flow: startAuth() → redirect usera do banku → callback z ?code= →
 * createSession(code) → sesja z listą kont → fetchTransactions(accountUid).
 *
 * Tryb "restricted" (darmowy): API widzi tylko konta podlinkowane do aplikacji
 * w panelu Enable Banking. Limit PSD2 na dostęp bez obecności usera: 4 wywołania
 * dziennie per konto — stąd cron synchronizuje co 6 h, nie co 15 min.
 */

const EB_BASE = 'https://api.enablebanking.com'
const JWT_TTL_S = 3600

function b64urlFromBytes(bytes) {
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function b64urlFromString(str) {
  return b64urlFromBytes(new TextEncoder().encode(str))
}

/** PEM (lub base64(PEM), lub sam base64-owy środek PEM = base64(DER)) → ArrayBuffer DER (PKCS#8). */
function pemToDer(pemOrB64) {
  // Sekrety z env bywają z literalnymi "\n" zamiast łamań linii — normalizujemy.
  let pem = String(pemOrB64 || '').replace(/\\n/g, '\n').trim()
  if (!pem.includes('-----BEGIN')) {
    let decoded
    try {
      decoded = atob(pem.replace(/\s+/g, ''))
    } catch {
      throw new Error('ENABLE_BANKING_PRIVATE_KEY is neither PEM nor base64(PEM/DER)')
    }
    if (!decoded.includes('-----BEGIN')) {
      // Nie PEM po odkodowaniu → to sam środek PEM, czyli base64(DER PKCS#8).
      // DER zaczyna się od SEQUENCE (0x30); PEM tekstem — rozróżnienie jest pewne.
      if (decoded.charCodeAt(0) !== 0x30) {
        throw new Error('ENABLE_BANKING_PRIVATE_KEY decodes to neither PEM nor PKCS#8 DER')
      }
      const der = new Uint8Array(decoded.length)
      for (let i = 0; i < decoded.length; i++) der[i] = decoded.charCodeAt(i)
      return der.buffer
    }
    pem = decoded
  }
  if (pem.includes('-----BEGIN RSA PRIVATE KEY-----') || pem.includes('-----BEGIN EC ')) {
    throw new Error('ENABLE_BANKING_PRIVATE_KEY must be PKCS#8 (BEGIN PRIVATE KEY); convert with: openssl pkcs8 -topk8 -nocrypt')
  }
  if (!pem.includes('-----BEGIN PRIVATE KEY-----')) {
    throw new Error('ENABLE_BANKING_PRIVATE_KEY must be an unencrypted PKCS#8 PEM (BEGIN PRIVATE KEY)')
  }
  const body = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s+/g, '')
  if (!body) {
    throw new Error('ENABLE_BANKING_PRIVATE_KEY has an empty PEM body — a multiline value got truncated to its first line; put base64 of the WHOLE .pem file in one line instead')
  }
  const bin = atob(body)
  const der = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) der[i] = bin.charCodeAt(i)
  return der.buffer
}

/** Podpisany JWT do Authorization: Bearer. */
export async function signEbJwt({ appId, privateKeyPem, now = Date.now() }) {
  if (!appId || !privateKeyPem) {
    throw new Error('ENABLE_BANKING_APP_ID / ENABLE_BANKING_PRIVATE_KEY not configured')
  }
  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToDer(privateKeyPem),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const iat = Math.floor(now / 1000)
  const header = b64urlFromString(JSON.stringify({ typ: 'JWT', alg: 'RS256', kid: appId }))
  const payload = b64urlFromString(JSON.stringify({
    iss: 'enablebanking.com',
    aud: 'api.enablebanking.com',
    iat,
    exp: iat + JWT_TTL_S,
  }))
  const data = `${header}.${payload}`
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(data))
  return `${data}.${b64urlFromBytes(new Uint8Array(sig))}`
}

export class EbApiError extends Error {
  constructor(status, body, path) {
    super(`Enable Banking ${path} → ${status}`)
    this.name = 'EbApiError'
    this.status = status
    this.body = body
  }
}

async function ebFetch(env, path, { method = 'GET', body, query } = {}) {
  const jwt = await signEbJwt({
    appId: env.ENABLE_BANKING_APP_ID,
    privateKeyPem: env.ENABLE_BANKING_PRIVATE_KEY,
  })
  const url = new URL(EB_BASE + path)
  for (const [k, v] of Object.entries(query || {})) {
    if (v != null && v !== '') url.searchParams.set(k, v)
  }
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${jwt}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let json
  try {
    json = text ? JSON.parse(text) : {}
  } catch {
    json = { raw: text.slice(0, 300) }
  }
  if (!res.ok) throw new EbApiError(res.status, json, path)
  return json
}

/** Start autoryzacji w banku. Zwraca { url } — tam przekierowujemy usera. */
export async function startBankAuth(env, { aspspName, aspspCountry = 'PL', redirectUrl, state, validDays = 90 }) {
  const validUntil = new Date(Date.now() + validDays * 24 * 3600 * 1000).toISOString()
  const res = await ebFetch(env, '/auth', {
    method: 'POST',
    body: {
      access: { valid_until: validUntil },
      aspsp: { name: aspspName, country: aspspCountry },
      redirect_url: redirectUrl,
      state,
      psu_type: 'personal',
    },
  })
  return { url: res.url, validUntil }
}

/** Wymiana ?code= z callbacku na sesję z listą kont. */
export async function createBankSession(env, code) {
  const res = await ebFetch(env, '/sessions', { method: 'POST', body: { code } })
  return {
    sessionId: res.session_id,
    accounts: Array.isArray(res.accounts) ? res.accounts : [],
    validUntil: res.access?.valid_until ?? null,
    aspsp: res.aspsp ?? null,
  }
}

/** Maskowanie IBAN do zapisu/wyświetlenia: PL61…0187. */
export function maskIban(iban) {
  const s = String(iban || '').replace(/\s+/g, '')
  if (s.length < 8) return s ? '…' + s.slice(-2) : null
  return `${s.slice(0, 4)}…${s.slice(-4)}`
}

/** Surowe konto z sesji EB → wpis do bank_connections.accounts (jsonb). */
export function mapSessionAccount(acc) {
  return {
    uid: acc.uid,
    displayName: acc.name || acc.product || acc.details || 'Konto',
    maskedIban: maskIban(acc.account_id?.iban),
    currency: acc.currency ?? null,
    lastBookedDate: null,
  }
}

/**
 * Jedna strona transakcji konta. `continuationKey` → kolejne strony.
 * dateFrom/dateTo: YYYY-MM-DD.
 */
export async function fetchAccountTransactions(env, accountUid, { dateFrom, dateTo, continuationKey } = {}) {
  const res = await ebFetch(env, `/accounts/${accountUid}/transactions`, {
    query: {
      date_from: dateFrom,
      date_to: dateTo,
      continuation_key: continuationKey,
    },
  })
  return {
    transactions: Array.isArray(res.transactions) ? res.transactions : [],
    continuationKey: res.continuation_key ?? null,
  }
}

// ====== Mapowanie transakcji EB → model HomeCashflow ======

/** Pierwsza niepusta linia remittance info (opis przelewu). */
function remittanceText(tx) {
  const ri = tx.remittance_information
  if (Array.isArray(ri)) return ri.filter((s) => typeof s === 'string' && s.trim()).join(' ').trim()
  if (typeof ri === 'string') return ri.trim()
  return ''
}

/** Czytelna nazwa wpisu: kontrahent, a gdy go brak — opis przelewu. */
export function transactionDisplayName(tx, kind) {
  const party = kind === 'expense' ? tx.creditor?.name : tx.debtor?.name
  const name = (party || '').trim() || remittanceText(tx)
  return (name || 'Transakcja bankowa').slice(0, 120)
}

/**
 * EB transaction → { kind, name, amount, txnDate, year, month, ref } albo null
 * gdy wpis nie nadaje się do importu (brak kwoty/daty, status inny niż zaksięgowany).
 */
export function mapBankTransaction(tx, accountUid) {
  // Tylko zaksięgowane — pendingi zmieniają treść/referencję przy księgowaniu.
  if (tx.status && tx.status !== 'BOOK') return null
  const rawAmount = Number(tx.transaction_amount?.amount)
  if (!Number.isFinite(rawAmount) || rawAmount === 0) return null
  const indicator = tx.credit_debit_indicator
  if (indicator !== 'DBIT' && indicator !== 'CRDT') return null
  const kind = indicator === 'DBIT' ? 'expense' : 'income'
  const txnDate = tx.booking_date || tx.value_date
  if (typeof txnDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(txnDate)) return null

  const name = transactionDisplayName(tx, kind)
  const amount = Math.abs(rawAmount)
  const refBase = tx.entry_reference
    || `${txnDate}:${amount}:${name}`.toLowerCase()
  return {
    kind,
    name,
    amount,
    txnDate,
    year: Number(txnDate.slice(0, 4)),
    month: Number(txnDate.slice(5, 7)) - 1,
    ref: `${accountUid}:${refBase}`,
  }
}

/** Normalizacja nazwiska/nazwy do porównań: małe litery, bez diakrytyków, pojedyncze spacje. */
function normalizeName(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ł/g, 'l')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Klucz porównawczy nazwiska: znormalizowane tokeny posortowane alfabetycznie —
 * banki piszą raz "IMIĘ NAZWISKO", raz "NAZWISKO IMIĘ". */
function nameKey(s) {
  return normalizeName(s).split(' ').filter(Boolean).sort().join(' ')
}

/**
 * Przelew między własnymi kontami usera? Pomijamy, żeby nie zawyżać
 * wydatków/przychodów. Dwa sygnały:
 *  1. kontrahent (odbiorca/nadawca) = PEŁNE imię i nazwisko właściciela
 *     połączenia (kolejność słów obojętna — "SOBIECKI PIOTR" też łapie);
 *     celowo pełne dopasowanie, nie samo nazwisko — przelew od domownika
 *     o tym samym nazwisku ma wejść,
 *  2. tytuł/kontrahent zawiera "przelew własny" (tak banki oznaczają
 *     przeksięgowania między rachunkami, np. na konto oszczędnościowe).
 */
export function isOwnTransfer(tx, ownerFullName) {
  const haystack = normalizeName(
    `${remittanceText(tx)} ${tx?.creditor?.name || ''} ${tx?.debtor?.name || ''}`,
  )
  if (haystack.includes('przelew wlasny')) return true
  const owner = nameKey(ownerFullName)
  if (!owner || !owner.includes(' ')) return false
  return nameKey(tx?.creditor?.name) === owner || nameKey(tx?.debtor?.name) === owner
}

// ====== Kategoryzacja wydatków po słowach kluczowych ======
//
// Wartości = domyślne nazwy kategorii z frontendu (DEFAULT_BUDGET_CATEGORIES).
// Kategoria jest przypisywana tylko, jeśli gospodarstwo MA budżet o tej nazwie
// (wydatek bez budżetu kategorii frontend pokazuje jako „Bez kategorii").
const CATEGORY_KEYWORDS = [
  ['Żywność', [
    'zabka', 'żabka', 'lidl', 'biedronka', 'aldi', 'kaufland', 'auchan', 'carrefour',
    'dino', 'stokrotka', 'netto', 'lewiatan', 'spolem', 'społem', 'intermarche',
    'piekarnia', 'cukiernia', 'delikatesy', 'mcdonald', 'kfc', 'burger king',
    'pizzeria', 'restauracja', 'pyszne.pl', 'glovo', 'bolt food', 'wolt',
  ]],
  ['Transport', [
    'orlen', 'bp ', 'shell', 'circle k', 'moya', 'lotos', 'amic',
    'mpk', 'ztm', 'zdmk', 'mzk', 'pkp', 'intercity', 'polregio', 'koleje',
    'jakdojade', 'uber', 'bolt.eu', 'freenow', 'parking', 'autostrad', 'e-toll',
  ]],
  ['Zdrowie i Higiena', [
    'apteka', 'rossmann', 'hebe', 'gemini', 'doz.pl', 'super-pharm', 'superpharm',
    'drogeria', 'luxmed', 'medicover', 'przychodnia', 'dentysta', 'stomatolog',
  ]],
  ['Rozrywka', [
    'netflix', 'spotify', 'hbo', 'disney', 'canal+', 'player.pl', 'youtube premium',
    'kino', 'multikino', 'helios', 'cinema city', 'empik', 'steam', 'playstation',
    'xbox', 'nintendo', 'tidal',
  ]],
  ['Ubrania i Obuwie', [
    'zalando', 'h&m', 'h & m', 'reserved', 'zara', 'ccc', 'deichmann', 'sinsay',
    'house', 'cropp', '4f', 'decathlon', 'vinted', 'answear', 'modivo',
  ]],
  ['Edukacja', [
    'udemy', 'coursera', 'ksiegarnia', 'księgarnia', 'szkola', 'szkoła', 'kurs',
  ]],
]

/**
 * Dopasuj kategorię po nazwie transakcji. `availableCategories` — nazwy budżetów
 * kategorii gospodarstwa (odszyfrowane); zwracamy tylko kategorię, która istnieje.
 * @returns {string | null}
 */
export function categorizeExpense(name, availableCategories) {
  const hay = String(name || '').toLowerCase()
  if (!hay) return null
  const available = new Map(
    (availableCategories || []).filter(Boolean).map((c) => [String(c).trim().toLowerCase(), String(c)]),
  )
  if (available.size === 0) return null
  for (const [category, keywords] of CATEGORY_KEYWORDS) {
    if (!available.has(category.toLowerCase())) continue
    if (keywords.some((kw) => hay.includes(kw))) return available.get(category.toLowerCase())
  }
  return null
}
