import dotenv from 'dotenv'
dotenv.config({ path: '../.env' })
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

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

  await sql`DELETE FROM invitations`
  await sql`DELETE FROM finance_data`
  await sql`DELETE FROM household_members`
  await sql`DELETE FROM households`
  await sql`DELETE FROM users`
}
