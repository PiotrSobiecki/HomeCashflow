/**
 * Warstwa I/O poświadczeń SmartThings (Faza 1) — odczyt/zapis tokenów do
 * smartthings_credentials z szyfrowaniem pól (ff1:… AES-GCM, FINANCE_DATA_KEY).
 * Logika decyzji o odświeżeniu siedzi w oauth.js (przetestowana); tu jest glue do DB.
 */

import { encryptField, decryptField } from '../finance-crypto.js'
import { ensureFreshAccessToken, refreshAccessToken } from './oauth.js'

/**
 * Cron (co 12h): proaktywnie odśwież tokeny wygasające w oknie `withinMs`, żeby user
 * nie został „rozłączony" przy 24h access tokenie. invalid_grant = refresh token padł
 * → zostawiamy wiersz (front pokaże „Połącz ponownie" przy próbie użycia).
 */
export async function refreshExpiringTokens(
  sql,
  { clientId, clientSecret, rawKey },
  { withinMs = 13 * 3600 * 1000, nowMs = Date.now(), refreshFn = refreshAccessToken } = {},
) {
  const cutoff = new Date(nowMs + withinMs).toISOString()
  const rows = await sql`
    SELECT household_id, refresh_token_enc, scopes, created_by
    FROM smartthings_credentials WHERE expires_at < ${cutoff}
  `
  let refreshed = 0
  let failed = 0
  for (const row of rows) {
    try {
      const refreshToken = await decryptField(row.refresh_token_enc, rawKey)
      const tokens = await refreshFn({ refreshToken, clientId, clientSecret }, { nowMs })
      await saveTokens(sql, {
        householdId: row.household_id,
        tokens,
        scopes: row.scopes,
        createdBy: row.created_by,
        rawKey,
      })
      refreshed++
    } catch (err) {
      failed++
      console.error('[smartthings] refresh failed for household', row.household_id, err?.code || err)
    }
  }
  return { due: rows.length, refreshed, failed }
}

/** Surowy wiersz poświadczeń albo null. */
export async function loadCredentialRow(sql, householdId) {
  const [row] = await sql`
    SELECT household_id, access_token_enc, refresh_token_enc, expires_at, scopes,
           location_id, samsung_account_id, verified_at
    FROM smartthings_credentials WHERE household_id = ${householdId}
  `
  return row ?? null
}

/** Zaszyfruj i zapisz (upsert) tokeny dla gospodarstwa. */
export async function saveTokens(sql, { householdId, tokens, scopes, createdBy, rawKey }) {
  const accessEnc = await encryptField(tokens.accessToken, rawKey)
  const refreshEnc = await encryptField(tokens.refreshToken, rawKey)
  const expiresAtIso = new Date(tokens.expiresAt).toISOString()
  await sql`
    INSERT INTO smartthings_credentials
      (household_id, access_token_enc, refresh_token_enc, expires_at, scopes, verified_at, created_by, updated_at)
    VALUES
      (${householdId}, ${accessEnc}, ${refreshEnc}, ${expiresAtIso}, ${scopes ?? null}, NOW(), ${createdBy ?? null}, NOW())
    ON CONFLICT (household_id) DO UPDATE SET
      access_token_enc = EXCLUDED.access_token_enc,
      refresh_token_enc = EXCLUDED.refresh_token_enc,
      expires_at = EXCLUDED.expires_at,
      scopes = COALESCE(EXCLUDED.scopes, smartthings_credentials.scopes),
      verified_at = NOW(),
      updated_at = NOW()
  `
}

/**
 * Zwraca ważny access token dla gospodarstwa (odświeża i utrwala przy wygaśnięciu).
 * null gdy gospodarstwo nie połączyło SmartThings. Rzuca z `.code='invalid_grant'`
 * gdy refresh token wygasł — wołający pokazuje banner „Połącz ponownie".
 */
export async function getFreshAccessToken(sql, { householdId, clientId, clientSecret, rawKey }, opts = {}) {
  const row = await loadCredentialRow(sql, householdId)
  if (!row) return null
  const credential = {
    accessToken: await decryptField(row.access_token_enc, rawKey),
    refreshToken: await decryptField(row.refresh_token_enc, rawKey),
    expiresAt: new Date(row.expires_at).getTime(),
  }
  return ensureFreshAccessToken(
    { credential, clientId, clientSecret },
    {
      nowMs: opts.nowMs,
      refreshFn: opts.refreshFn ?? refreshAccessToken,
      onRefreshed: async (tokens) =>
        saveTokens(sql, { householdId, tokens, scopes: row.scopes, createdBy: row.created_by, rawKey }),
    },
  )
}
