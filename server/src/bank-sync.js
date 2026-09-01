/**
 * Synchronizacja transakcji bankowych (Enable Banking) → tabela transactions.
 *
 * Dedup: bank_txn_ref = "<accountUid>:<entry_reference|fallback>" + partial unique
 * index (household_id, bank_txn_ref) → INSERT … ON CONFLICT DO NOTHING jest
 * idempotentny, więc okna synchronizacji mogą się nakładać.
 *
 * Okno: od lastBookedDate konta minus 4 dni (przelewy księgują się z opóźnieniem),
 * pierwszy sync — od DNIA POŁĄCZENIA (wcześniejsza historia jest wpisana ręcznie;
 * data utworzenia połączenia to twarda podłoga, więc overlap nie cofnie się przed
 * nią i nie wskrzesi ręcznie usuniętych importów). PSD2 ogranicza dostęp bez
 * obecności usera do 4 wywołań/dobę per konto, dlatego cron woła to co 6 h.
 *
 * Wpisy pokryte pozycjami stałymi gospodarstwa (matchesFixedItem) są pomijane,
 * żeby abonament wpisany ręcznie nie liczył się w miesiącu podwójnie.
 */
import { encryptField, decryptField } from './finance-crypto.js'
import {
  fetchAccountTransactions, mapBankTransaction, categorizeExpense, isOwnTransfer,
  matchesFixedItem, EbApiError,
} from './enable-banking.js'

const OVERLAP_DAYS = 4
const MAX_PAGES_PER_ACCOUNT = 10

function isoDateDaysAgo(days, from = new Date()) {
  const d = new Date(from.getTime() - days * 24 * 3600 * 1000)
  return d.toISOString().slice(0, 10)
}

/** Odszyfrowane nazwy budżetów kategorii gospodarstwa (do auto-kategoryzacji). */
async function loadCategoryNames(sql, householdId, rawKey) {
  const rows = await sql`SELECT name FROM category_budgets WHERE household_id = ${householdId}`
  const names = []
  for (const r of rows) {
    const name = await decryptField(r.name, rawKey)
    if (name) names.push(name)
  }
  return names
}

/**
 * Pozycje stałe gospodarstwa (odszyfrowane) pogrupowane po (rok, miesiąc),
 * plus wpisy deleted_fixed_items — do rozstrzygania, co dany miesiąc "widzi".
 */
async function loadFixedIndex(sql, householdId, rawKey) {
  const [rows, deleted] = await Promise.all([
    sql`SELECT kind, name, amount, year, month FROM transactions
        WHERE household_id = ${householdId} AND is_fixed = true`,
    sql`SELECT kind, name, year, month FROM deleted_fixed_items
        WHERE household_id = ${householdId}`,
  ])
  const byMonth = new Map()
  for (const r of rows) {
    const name = await decryptField(r.name, rawKey)
    const amount = Number(await decryptField(r.amount, rawKey))
    if (!name) continue
    const key = `${r.year}-${r.month}`
    if (!byMonth.has(key)) byMonth.set(key, [])
    byMonth.get(key).push({ kind: r.kind, name, amount })
  }
  const deletedByMonth = new Map()
  for (const d of deleted) {
    const key = `${d.year}-${d.month}`
    if (!deletedByMonth.has(key)) deletedByMonth.set(key, new Set())
    deletedByMonth.get(key).add(`${d.kind}:${d.name}`)
  }
  return { byMonth, deletedByMonth }
}

/**
 * Pozycje stałe obowiązujące w danym miesiącu — jak propagacja na froncie:
 * własne wiersze miesiąca plus te z najbliższego wcześniejszego miesiąca tego
 * roku, których miesiąc nie ma pod tą samą nazwą ani nie usunął
 * (deleted_fixed_items). Cron może importować 1. dnia miesiąca, zanim ktokolwiek
 * otworzy aplikację i propagacja utworzy wiersze — stąd fallback.
 */
function fixedItemsForMonth(index, year, month) {
  const own = index.byMonth.get(`${year}-${month}`) ?? []
  let inheritedSource = []
  for (let m = month - 1; m >= 0; m--) {
    const rows = index.byMonth.get(`${year}-${m}`)
    if (rows && rows.length) { inheritedSource = rows; break }
  }
  const ownKeys = new Set(own.map((i) => `${i.kind}:${i.name}`))
  const deleted = index.deletedByMonth.get(`${year}-${month}`) ?? new Set()
  const inherited = inheritedSource.filter((i) => {
    const k = `${i.kind}:${i.name}`
    return !ownKeys.has(k) && !deleted.has(k)
  })
  return own.concat(inherited)
}

/**
 * Synchronizuje jedno połączenie bankowe. Zwraca { imported, skipped, failed }.
 * Mutuje wiersz bank_connections (accounts.lastBookedDate, last_sync_at, status).
 */
export async function syncBankConnection(sql, rawKey, env, connection) {
  const accounts = Array.isArray(connection.accounts) ? connection.accounts : []
  let imported = 0
  let skipped = 0

  try {
    const categoryNames = await loadCategoryNames(sql, connection.household_id, rawKey)
    const fixedIndex = await loadFixedIndex(sql, connection.household_id, rawKey)
    // Pełne imię i nazwisko właściciela połączenia — filtr przelewów własnych.
    const [owner] = await sql`SELECT name FROM users WHERE id = ${connection.user_id}`
    const ownerFullName = owner?.name ?? null

    // Podłoga okna: dzień utworzenia połączenia — przed nim nigdy nie sięgamy.
    const floorDate = connection.created_at
      ? new Date(connection.created_at).toISOString().slice(0, 10)
      : isoDateDaysAgo(0)

    let firstError = null
    let expired = false

    for (const account of accounts) {
      if (!account?.uid) continue
      let dateFrom = account.lastBookedDate
        ? isoDateDaysAgo(OVERLAP_DAYS, new Date(account.lastBookedDate))
        : floorDate
      if (dateFrom < floorDate) dateFrom = floorDate

      let continuationKey = null
      let pages = 0
      let maxBooked = account.lastBookedDate ?? null

      // Błąd jednego konta (np. 429 z banku) nie przerywa pozostałych — każde
      // konto ma własny dobowy limit PSD2, a watermark udanych musi się zapisać.
      try {
        do {
          const page = await fetchAccountTransactions(env, account.uid, { dateFrom, continuationKey })
          continuationKey = page.continuationKey
          pages += 1

          for (const raw of page.transactions) {
            const tx = mapBankTransaction(raw, account.uid)
            if (!tx) { skipped += 1; continue }
            if (maxBooked == null || tx.txnDate > maxBooked) maxBooked = tx.txnDate
            // Przelew między własnymi kontami — pomijamy PO przesunięciu watermarka.
            if (isOwnTransfer(raw, ownerFullName)) { skipped += 1; continue }
            // Pokryte pozycją stałą (abonament wpisany ręcznie) — bez duplikatu.
            if (matchesFixedItem(raw, tx, fixedItemsForMonth(fixedIndex, tx.year, tx.month))) {
              skipped += 1
              continue
            }

            const category = tx.kind === 'expense'
              ? categorizeExpense(tx.name, categoryNames)
              : null
            const nameEnc = await encryptField(tx.name, rawKey)
            const amountEnc = await encryptField(tx.amount, rawKey)
            const inserted = await sql`
              INSERT INTO transactions
                (household_id, kind, name, amount, txn_date, year, month, is_fixed,
                 category, created_by, source, bank_txn_ref)
              VALUES
                (${connection.household_id}, ${tx.kind}, ${nameEnc}, ${amountEnc},
                 ${tx.txnDate}, ${tx.year}, ${tx.month}, false,
                 ${category}, ${connection.user_id}, 'bank', ${tx.ref})
              ON CONFLICT (household_id, bank_txn_ref) WHERE bank_txn_ref IS NOT NULL
              DO NOTHING
              RETURNING id
            `
            if (inserted.length > 0) imported += 1
            else skipped += 1
          }
        } while (continuationKey && pages < MAX_PAGES_PER_ACCOUNT)

        account.lastBookedDate = maxBooked
      } catch (err) {
        // 401/403 = sesja wygasła albo cofnięta zgoda → oznacz do ponownego połączenia.
        if (err instanceof EbApiError && (err.status === 401 || err.status === 403)) expired = true
        const message = err instanceof EbApiError
          ? `EB ${err.status}: ${JSON.stringify(err.body).slice(0, 200)}`
          : String(err?.message || err).slice(0, 200)
        if (!firstError) firstError = message
        console.error('[bank-sync] account failed', connection.id, account.uid, message)
      }
    }

    // Watermarki zapisujemy zawsze — także przy częściowym błędzie — żeby udane
    // konta nie pobierały tych samych stron drugi raz (dobowy limit PSD2).
    if (firstError) {
      await sql`
        UPDATE bank_connections
        SET accounts = ${JSON.stringify(accounts)}::jsonb,
            status = ${expired ? 'expired' : connection.status},
            last_sync_error = ${firstError},
            updated_at = NOW()
        WHERE id = ${connection.id}
      `
      return { imported, skipped, failed: 1 }
    }
    await sql`
      UPDATE bank_connections
      SET accounts = ${JSON.stringify(accounts)}::jsonb,
          last_sync_at = NOW(),
          last_sync_error = NULL,
          updated_at = NOW()
      WHERE id = ${connection.id}
    `
    return { imported, skipped, failed: 0 }
  } catch (err) {
    // Nieoczekiwany błąd poza pętlą kont (np. baza) — zapisz i zgłoś jak dotąd.
    const message = String(err?.message || err).slice(0, 200)
    await sql`
      UPDATE bank_connections
      SET last_sync_error = ${message},
          updated_at = NOW()
      WHERE id = ${connection.id}
    `
    console.error('[bank-sync] connection failed', connection.id, message)
    return { imported, skipped, failed: 1 }
  }
}

/**
 * Synchronizacja wszystkich aktywnych połączeń (cron) lub jednego gospodarstwa
 * (ręczny "Synchronizuj teraz"). Zwraca zagregowane { connections, imported, skipped, failed }.
 */
export async function syncBankConnections(sql, rawKey, env, { householdId } = {}) {
  const rows = householdId
    ? await sql`SELECT * FROM bank_connections WHERE status = 'active' AND household_id = ${householdId}`
    : await sql`SELECT * FROM bank_connections WHERE status = 'active'`

  const totals = { connections: rows.length, imported: 0, skipped: 0, failed: 0 }
  for (const row of rows) {
    const res = await syncBankConnection(sql, rawKey, env, row)
    totals.imported += res.imported
    totals.skipped += res.skipped
    totals.failed += res.failed
  }
  return totals
}
