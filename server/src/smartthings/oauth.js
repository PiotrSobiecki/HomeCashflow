/**
 * OAuth 2.0 (Authorization Code) dla SmartThings — czyste helpery.
 * Jeden OAuth-In SmartApp na całą apkę (Client ID/Secret w env); tokeny per
 * gospodarstwo trzymane zaszyfrowane w tabeli smartthings_credentials.
 *
 * @see https://developer.smartthings.com/docs/connected-services/oauth-integrations
 */

// OAuth (authorize + token) chodzi przez host regionalny `oauthin-regional`, NIE przez
// api.smartthings.com (ten zwraca 403 na /oauth/* — służy do API urządzeń). Potwierdzone
// empirycznie + zgodne z tym, czego używa SmartThings CLI przy logowaniu.
export const SMARTTHINGS_AUTHORIZE_URL = 'https://oauthin-regional.api.smartthings.com/oauth/authorize'
export const SMARTTHINGS_TOKEN_URL = 'https://oauthin-regional.api.smartthings.com/oauth/token'

/**
 * Parsuje odpowiedź token endpointu na znormalizowany kształt.
 * `expiresAt` liczone względem wstrzykniętego `nowMs` (testowalne bez Date.now).
 */
export function parseTokenResponse(json, nowMs) {
  if (json.error) {
    const err = new Error(`SmartThings OAuth error: ${json.error}${json.error_description ? ` (${json.error_description})` : ''}`)
    err.code = json.error
    throw err
  }
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    scope: json.scope,
    expiresAt: nowMs + json.expires_in * 1000,
  }
}

/** Nagłówek Basic auth z client_id:client_secret (uwierzytelnianie klienta OAuth). */
function basicAuthHeader(clientId, clientSecret) {
  return 'Basic ' + btoa(`${clientId}:${clientSecret}`)
}

/** Wspólny POST do token endpointu (oba granty); zwraca znormalizowane tokeny. */
async function postTokenRequest(params, { clientId, clientSecret, fetchFn, nowMs }) {
  const res = await fetchFn(SMARTTHINGS_TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: basicAuthHeader(clientId, clientSecret),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(params).toString(),
  })
  return parseTokenResponse(await res.json(), nowMs)
}

/**
 * Wymiana authorization code na tokeny. `fetchFn`/`nowMs` wstrzykiwane (DI granicy
 * — testowalne bez sieci ani Date.now). Rzuca z `.code` przy błędzie OAuth.
 */
export async function exchangeCodeForTokens(
  { code, clientId, clientSecret, redirectUri },
  { fetchFn = fetch, nowMs = Date.now() } = {},
) {
  return postTokenRequest(
    { grant_type: 'authorization_code', code, redirect_uri: redirectUri },
    { clientId, clientSecret, fetchFn, nowMs },
  )
}

/**
 * Odświeżenie access tokenu refresh tokenem. SmartThings rotuje refresh token
 * niekonsekwentnie — gdy odpowiedź go nie zawiera, zachowujemy poprzedni.
 */
export async function refreshAccessToken(
  { refreshToken, clientId, clientSecret },
  { fetchFn = fetch, nowMs = Date.now() } = {},
) {
  const tokens = await postTokenRequest(
    { grant_type: 'refresh_token', refresh_token: refreshToken, client_id: clientId },
    { clientId, clientSecret, fetchFn, nowMs },
  )
  if (!tokens.refreshToken) tokens.refreshToken = refreshToken
  return tokens
}

/**
 * Czy access token wygasł (z buforem `skewSec` przed realnym wygaśnięciem,
 * żeby odświeżać proaktywnie i nie trafiać w 401 w locie).
 */
export function isAccessTokenExpired(expiresAt, nowMs, skewSec = 60) {
  return nowMs >= expiresAt - skewSec * 1000
}

/**
 * Zwraca ważny access token: jeśli wygasł — odświeża (`refreshFn`), utrwala nowe tokeny
 * (`onRefreshed`) i zwraca świeży. I/O wstrzyknięte — czysta orkiestracja decyzji.
 * @param {{credential:{accessToken:string,refreshToken:string,expiresAt:number},clientId:string,clientSecret:string}} args
 */
export async function ensureFreshAccessToken(
  { credential, clientId, clientSecret },
  { nowMs = Date.now(), refreshFn = refreshAccessToken, onRefreshed } = {},
) {
  if (!isAccessTokenExpired(credential.expiresAt, nowMs)) {
    return credential.accessToken
  }
  const tokens = await refreshFn(
    { refreshToken: credential.refreshToken, clientId, clientSecret },
    { nowMs },
  )
  if (onRefreshed) await onRefreshed(tokens)
  return tokens.accessToken
}

/** Buduje URL ekranu zgody Samsung (redirect z /api/smartthings/connect). */
export function buildAuthorizeUrl({ clientId, redirectUri, scopes, state }) {
  const url = new URL(SMARTTHINGS_AUTHORIZE_URL)
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('scope', scopes.join(' '))
  url.searchParams.set('state', state)
  return url.toString()
}
