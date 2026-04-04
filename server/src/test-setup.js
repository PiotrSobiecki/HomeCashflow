import dotenv from 'dotenv'
dotenv.config({ path: '../.env' })
import { neon } from '@neondatabase/serverless'

// Testy wymagają stałego klucza (32 B hex); w .env możesz nadpisać FINANCE_DATA_KEY.
if (!process.env.FINANCE_DATA_KEY) {
  process.env.FINANCE_DATA_KEY =
    '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
}

/** Lazy init — żeby suite bez DB (np. finance-crypto) nie padał przy złym DATABASE_URL w .env */
let sqlSingleton = null
function getTestSql() {
  if (sqlSingleton) return sqlSingleton
  const raw = process.env.DATABASE_URL?.trim() ?? ''
  if (!/^postgres(ql)?:\/\//i.test(raw)) {
    throw new Error(
      '[vitest] DATABASE_URL musi zaczynać się od postgresql:// (bez komendy psql w tej samej linii).',
    )
  }
  sqlSingleton = neon(raw)
  return sqlSingleton
}

/**
 * Kasuje WSZYSTKIE wiersze w tabelach aplikacji (users, households, finance_data, …).
 * Wywoływane przed każdym testem Vitest.
 *
 * Jeśli DATABASE_URL w .env to produkcja i uruchomisz `npm test` w server/, baza zostanie
 * opróżniona — stąd „zupełnie pusta” baza po testach lokalnych.
 *
 * Aby testy mogły czyścić bazę, ustaw w .env: ALLOW_VITEST_DB_WIPE=yes
 * (tylko przy osobnym branchu / projekcie Neon przeznaczonym na testy).
 */
export async function cleanDb() {
  if (process.env.ALLOW_VITEST_DB_WIPE !== 'yes') {
    throw new Error(
      '[vitest] Blokada cleanDb: nie ustawiono ALLOW_VITEST_DB_WIPE=yes. ' +
        'Bez tego nie czyścimy bazy (ochrona przed przypadkowym skasowaniem produkcji). ' +
        'Użyj osobnego DATABASE_URL (branch dev w Neon) i dopiero wtedy ALLOW_VITEST_DB_WIPE=yes. ' +
        'Zob. komentarz w server/src/test-setup.js'
    )
  }

  const sql = getTestSql()
  await sql`DELETE FROM invitations`
  await sql`DELETE FROM finance_data`
  await sql`DELETE FROM household_members`
  await sql`DELETE FROM households`
  await sql`DELETE FROM users`
}
