// Diagnostyka: surowe transakcje z Enable Banking dla aktywnych połączeń.
// Pokazuje komplet pól, jakie zwraca bank — do decyzji, co mapować na nazwę/kategorię.
// IBAN-y i długie ciągi cyfr (telefony, numery kart) są maskowane.
//
//   node scripts/eb-raw-tx.mjs [dni=20] [filtr=MOBILE-PAYMENT]
//
// Env ładowany jak w src/index.js (root .env/.env.local, potem server/.env/.env.local).
// Uwaga: każde uruchomienie zużywa 1 z 4 dobowych wywołań PSD2 na konto.
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const here = dirname(fileURLToPath(import.meta.url))
for (const [dir, name] of [
  [join(here, '../..'), '.env'], [join(here, '../..'), '.env.local'],
  [join(here, '..'), '.env'], [join(here, '..'), '.env.local'],
]) dotenv.config({ path: join(dir, name), override: true })

const { neon } = await import('@neondatabase/serverless')
const { fetchAccountTransactions } = await import('../src/enable-banking.js')

const days = Number(process.argv[2] || 20)
const filter = process.argv[3] || 'MOBILE-PAYMENT'

// ENV_SUFFIX=production → dociągnij root plik ".env.<suffix>" z prod bazą
// (połączenia bankowe są tylko w prod).
if (process.env.ENV_SUFFIX) {
  dotenv.config({ path: join(here, '../..', `.env.${process.env.ENV_SUFFIX}`), override: true })
}
const sql = neon(process.env.DATABASE_URL)
const env = {
  ENABLE_BANKING_APP_ID: process.env.ENABLE_BANKING_APP_ID,
  ENABLE_BANKING_PRIVATE_KEY: process.env.ENABLE_BANKING_PRIVATE_KEY,
}
const mask = (s) => String(s)
  .replace(/\b[A-Z]{2}\d{2}[\dA-Z ]{10,30}\b/g, 'IBAN…')
  .replace(/\b\d{9,}\b/g, (m) => m.slice(0, 5) + '…')
const dump = (t) => console.log(mask(JSON.stringify(t, null, 1)))

const rows = await sql`SELECT id, accounts FROM bank_connections WHERE status = 'active'`
const dateFrom = new Date(Date.now() - days * 864e5).toISOString().slice(0, 10)

for (const r of rows) {
  for (const acc of r.accounts || []) {
    let page
    try {
      page = await fetchAccountTransactions(env, acc.uid, { dateFrom })
    } catch (err) {
      // 429 = wyczerpany dobowy limit PSD2 (cron 0/6/12/18 UTC zużywa 4/4) — próbuj kolejne konto.
      console.log(`\n== ${acc.displayName}: błąd ${err.status ?? ''} ${err.body?.error ?? err.message}`)
      continue
    }
    const keys = new Set()
    for (const t of page.transactions) Object.keys(t).forEach((k) => keys.add(k))
    console.log(`\n== ${acc.displayName}: ${page.transactions.length} tx od ${dateFrom}`)
    console.log('klucze:', [...keys].join(', '))

    const hit = page.transactions.filter((t) => JSON.stringify(t).includes(filter))
    const rest = page.transactions.filter((t) => !JSON.stringify(t).includes(filter))
    console.log(`\n-- pasujące do "${filter}": ${hit.length} (pokazuję do 3)`)
    hit.slice(0, 3).forEach(dump)
    console.log(`\n-- pozostałe: ${rest.length} (pokazuję do 2)`)
    rest.slice(0, 2).forEach(dump)
  }
}
