# Plan: Bank-sync (PSD2 via GoCardless)

> Source PRD: [issue #14](https://github.com/PiotrSobiecki/HomeCashflow/issues/14) · kopia lokalna: `plans/prd-bank-sync.md`

## Architectural decisions

Durable przez wszystkie fazy:

- **Architecture style**: cienki klient HTTP do GoCardless (Workers fetch) → silnik sync uruchamiany z Cloudflare Cron Trigger co 4h + endpoint do manualnego triggera → buffer w tabeli `transaction_inbox` → user-driven approval przenosi do `transactions`. Bez webhooków, bez kolejek.
- **Provider boundary**: GoCardless Bank Account Data API (free tier), polski region. **Jedno wspólne konto GC** trzymane przez admina apki — klucze `GOCARDLESS_SECRET_ID` i `GOCARDLESS_SECRET_KEY` w Cloudflare Workers secrets. Wszystkie gospodarstwa współdzielą limit 50 end-userów; izolacja per `household_id` jest w naszej DB, nie w GC.
- **Data model — nowe tabele**:
  - `bank_connections` — 1 row per (household, bank). Trzyma `requisition_id` z GC, `institution_*`, `status`, `expires_at` (PSD2 90d), `last_synced_at`, `next_sync_at`.
  - `bank_accounts` — N rows per `bank_connection`. Wybór ownera z dostępnych kont GC, z toggle `enabled`.
  - `transaction_inbox` — pre-import buffer. `gc_transaction_id UNIQUE` dla dedupe vs GC, `description_enc`/`amount_enc` szyfrowane, `suggested_category` z reguł, `duplicate_of_id` flaguje match vs manual, `status` (pending/approved/dismissed).
  - `categorization_rules` — pattern → kategoria per household, `hit_count` do priorytetyzacji konfliktów.
- **Data model — kolumny w istniejącej tabeli `transactions`**:
  - `source TEXT DEFAULT 'manual'` — `'manual' | 'bank'`.
  - `bank_inbox_id UUID NULL` — back-link do inbox row dla audytu.
- **Encryption**: pola sensytywne (`transaction_inbox.description`, `.amount`) szyfrowane tym samym `FINANCE_DATA_KEY` (AES-GCM) co `transactions.name`/`amount`. `requisition_id` i `pattern` plaintext.
- **Auth / Permissions**: wszystko owner-only (już mamy `assertCanMutateResource` + `isHouseholdOwner` na froncie). Bank-wpisy mają `created_by = owner.id`, więc member nie może ich mutować dzięki istniejącemu guardowi.
- **Action log integration**: bank-import to **jeden bulk wpis** w `action_log` per sync (`resource_type='bank_import'`), nie N osobnych CREATE-ów. Okno undo 24h obowiązuje (cofnięcie usuwa cały batch).
- **Polityka prywatności + DPA**: admin apki jest data processor dla danych bankowych wszystkich gospodarstw. Polityka prywatności wymienia GoCardless Ltd. Zgoda przy podpinaniu banku.

---

## Phase 1: Setup admina + monitoring wykorzystania GC

**User stories**: 30, 31, 32

### What to build

Cienka faza ops/infra widoczna tylko dla admina apki. Dodaje sekret GC do Workers, wprowadza whitelist email admin-ów (`ADMIN_EMAILS`), tworzy endpoint zwracający bieżące wykorzystanie konta GoCardless (X/50 aktywnych requisitions + lista najwcześniej wygasających). Hard-block w przyszłym endpoincie `POST /api/bank/connect` (jeszcze nie istniejący) sprawdza limit i zwraca 503 z `gc_limit_reached` gdy ≥50 — wprowadzamy tu helper który Phase 2 użyje.

### Acceptance criteria

- [ ] `GOCARDLESS_SECRET_ID` i `GOCARDLESS_SECRET_KEY` ustawione przez `wrangler secret put` na dev i prod
- [ ] `ADMIN_EMAILS` (comma-separated) w env
- [ ] Cienki klient GC umie zrobić `GET /requisitions/?status=LN` z auth tokenem (z testem na mock fetch)
- [ ] `GET /api/admin/gc-usage` zwraca 200 z `{ used, limit: 50, expiring_soonest: [...] }` dla zalogowanego admina, 403 dla nie-admin-a
- [ ] Helper `assertGcCapacity()` zwraca błąd `gc_limit_reached` gdy >=50 — testowalny niezależnie
- [ ] Manual smoke z REAL GC sandbox / staging account

---

## Phase 2: Podpinanie banków (connect + disconnect)

**User stories**: 1, 2, 3, 4, 5, 6, 7

### What to build

Pełen end-to-end flow podpięcia i odpięcia banku, bez sync transakcji. Owner widzi w ustawieniach gospodarstwa nową sekcję "Bank-sync", klika "Połącz bank" → apka pyta GC o listę polskich banków → grid kafelków z logami → wybór → redirect na hosted page banku → bank login + zgoda PSD2 → callback do apki → ekran wyboru kont z checkboxami → zapis w DB. Lista podpiętych banków pokazuje status każdego (active / expiring / expired / revoked) z przyciskiem "Odłącz" (woła GC delete requisition + kasuje powiązania). Member nie widzi tej sekcji w ustawieniach.

Tabele `bank_connections` i `bank_accounts` powstają w tej fazie.

### Acceptance criteria

- [ ] Migracja drizzle dodaje `bank_connections` + `bank_accounts`
- [ ] Klient GC umie: `listInstitutions(country)`, `createRequisition({...})`, `getRequisition(id)`, `getAccountDetails(id)`, `deleteRequisition(id)` — każdy z testem
- [ ] Endpointy: `POST /api/bank/connect` (rozpoczyna flow, używa `assertGcCapacity()` z Phase 1), `GET /api/bank/callback`, `POST /api/bank/connections/:id/accounts` (zapis wyboru kont), `GET /api/bank/connections`, `DELETE /api/bank/connections/:id`
- [ ] Wszystkie endpointy owner-only (403 dla member, integration test)
- [ ] Frontend: grid banków z logami (z GC `/institutions`), redirect na hosted page, ekran post-callback z wyborem kont
- [ ] Lista podpiętych banków w nowej sekcji ustawień gospodarstwa, owner-only
- [ ] Manual E2E: prawdziwe podpięcie testowego konta przez GC sandbox

---

## Phase 3: Sync engine + inbox + badge + edit-guard

**User stories**: 8, 9, 12, 13, 14, 15, 20, 21, 22, 28, 29

### What to build

Najgrubsza faza — wprowadza całą produkcyjną pętlę sync. Cloudflare Cron Trigger co 4h iteruje aktywne connections i ściąga nowe transakcje od `last_synced_at`. Każda transakcja mapowana po znaku kwoty (dodatnia → income, ujemna → expense, `abs()`), trafia do `transaction_inbox` z `status=pending`. Bez reguł i bez dedupe vs manual w tej fazie — to robi Phase 4. Owner widzi nowy widok "Inbox" z listą propozycji (opis, kwota, data), zatwierdza ręcznie wybierając kategorię z dropdownu → wpis ląduje w `transactions` z `source='bank'` i `bank_inbox_id`. Może też kliknąć "Pomiń". Zatwierdzone wpisy pokazują badge `🏦 z banku` w listach przychodów/wydatków. Edit kategorii i nazwy działa jak dla manualnych; PATCH z `amount` lub `txn_date` w body zwraca 400 dla wpisów z `source='bank'`. Cały batch sync zapisany jako jeden wpis w `action_log` z `resource_type='bank_import'` — undo (do 24h) usuwa wszystkie zatwierdzone wpisy z tego batcha + inbox rows.

Tabela `transaction_inbox` + kolumny `source` i `bank_inbox_id` w `transactions` powstają w tej fazie.

### Acceptance criteria

- [ ] Migracja drizzle dodaje `transaction_inbox` + 2 kolumny w `transactions`
- [ ] Klient GC dodaje `getTransactions(accountId, dateFrom)` z testem
- [ ] Sync engine: integration test 0/1/N transakcji, mapowanie znaku, encrypt description/amount przed zapisem do inbox, idempotencja po `gc_transaction_id`
- [ ] Cloudflare Cron Trigger zarejestrowany na 4h cycle, iteruje `WHERE status='active' AND next_sync_at <= NOW()`
- [ ] `POST /api/bank/sync` — manualny trigger, owner-only, 503 jeśli inny sync w toku
- [ ] Endpointy inbox: `GET /api/inbox?status=pending`, `POST /api/inbox/:id/approve { category }`, `POST /api/inbox/:id/dismiss`
- [ ] Inbox UI: lista, dropdown kategorii (z `category_budgets`), Zatwierdź/Pomiń
- [ ] Badge `🏦 z banku` w `IncomeSection`/`ExpenseSection` przy `source='bank'`
- [ ] PATCH transactions: dla `source='bank'` blokuje zmianę `amount` i `txn_date` — test + 400 z `field_frozen_bank`
- [ ] `action_log` integration: 1 wpis per sync z `count: N`, undo cofa cały batch — integration test
- [ ] Manual E2E: sync z prawdziwego konta sandbox, widać w inboxie, zatwierdzasz, widać w budżecie z badge

---

## Phase 4: Reguły kategoryzacji + dedupe vs manual + transfer/ATM skip

**User stories**: 10, 11, 16, 17, 18, 19

### What to build

Mądrzejszy sync. Przy zatwierdzaniu wpisu w inboxie pojawia się checkbox "zapamiętaj: opis zawiera 'Biedronka' → Żywność" — zaznaczenie tworzy `categorization_rules` row. Kolejne synci stosują reguły: dla każdej transakcji `applyRules(rules, txn)` zwraca sugerowaną kategorię (substring matching, case-insensitive, priorytet po `hit_count` desc). Inbox pokazuje sugerowaną kategorię obok dropdownu (user może override). Drugi dodatek: dedupe vs manual — przy zapisie do inbox, dla każdej transakcji szukaj manual `transaction` z `txn_date = booking_date` i `ABS(amount) match ±0.01` → flag `duplicate_of_id`. Inbox pokazuje "to wygląda na duplikat ręcznego X" z przyciskiem "to jest duplikat → pomiń". Trzeci dodatek: w sync engine filtr typów transakcji — pomijaj `bankTransactionCode` które oznaczają transfer wewnętrzny lub wypłatę bankomatu (lista kodów do udoskonalenia w trakcie dogfoodingu z PKO/ING).

Tabela `categorization_rules` powstaje w tej fazie.

### Acceptance criteria

- [ ] Migracja drizzle dodaje `categorization_rules`
- [ ] `applyRules(rules, transaction)` — 10+ unit testów bez DB (case-insensitive, substring, brak match, konflikt → highest `hit_count`, edge cases)
- [ ] Sync engine wywołuje `applyRules` i zapisuje `suggested_category` w inbox
- [ ] Sync engine implementuje dedupe vs manual: dla każdej transakcji query w `transactions WHERE txn_date=? AND ABS(amount-?)<0.01 AND household_id=?` → ustaw `duplicate_of_id`
- [ ] Filtr transferów/ATM: lista `SKIP_TRANSACTION_CODES` (stała), sync pomija transakcje z tymi kodami
- [ ] `POST /api/inbox/:id/approve` rozszerzony o `rememberRule?: boolean` → upsert do `categorization_rules` z `hit_count` start = 1
- [ ] `categorization_rules` `hit_count++` przy każdym zastosowaniu (w sync engine)
- [ ] Inbox UI: sugerowana kategoria preselected w dropdown, checkbox "zapamiętaj regułę", banner "duplikat ręcznego" + przycisk pomiń
- [ ] Manual E2E: zatwierdź "Biedronka 50 zł" z regułą → wstaw manual "Biedronka 30 zł" → następny sync z "Biedronka 30 zł" tego samego dnia → inbox pokazuje sugesti `Żywność` + flag duplikat

---

## Phase 5: Re-auth flow (90d PSD2 cycle) — emaile + bannery

**User stories**: 23, 24, 25, 26, 27

### What to build

Obsługa cyklu 90 dni zgody PSD2 żeby sync nie znikał po cichu. Codzienny Cron Trigger (osobny od 4h sync) sprawdza connections z `expires_at - NOW() <= 7 days`. Wysyła email przez Resend (template PL) na 7 dni przed wygaśnięciem i drugi na 1 dzień przed. `last_warned_at` zapobiega spamowi. UI: nowy komponent `RenewConsentBanner` na dashboardzie widoczny tylko ownerowi gdy ma jakąś connection w stanie expiring lub expired. Żółty (expiring), czerwony (expired). Klik "Odnów" prowadzi przez ten sam flow co Phase 2 (grid banków z preselected institution → bank login → wybór kont) — backend rozpoznaje że to renewal i zastępuje stary `bank_connections` row w miejscu, zachowując `id` żeby `transaction_inbox.bank_connection_id` nie zostały sierotami.

### Acceptance criteria

- [ ] Codzienny Cron Trigger (oddzielny route) iteruje connections z expiring/expired
- [ ] Email template PL przez Resend (Lazy load — testowalny przez mock Resend)
- [ ] `last_warned_at` aktualizowany po wysłaniu, drugi email po >=6 dniach od pierwszego
- [ ] `RenewConsentBanner` na dashboardzie, owner-only, kolor wg statusu, przycisk "Odnów"
- [ ] Flow "Odnów" wykorzystuje istniejące endpointy Phase 2 z parametrem `renew_connection_id` → backend zastępuje row in-place (zachowuje `id` i `bank_accounts` jeśli te same gc_account_id)
- [ ] Integration test: insert connection z `expires_at = NOW + 7d` → odpal cron → email log + status banneru
- [ ] Manual E2E: ustawić `expires_at` w DB ręcznie na +1d → odebrać email → przejść flow renew → connection.expires_at się odnawia

---

## Phase 6: Dokumentacja + polityka prywatności

**User stories**: cross-cutting (dotyczy całego feature'a)

### What to build

Dwa rodzaje dokumentacji. (1) README — nowa sekcja "Sync z bankiem" dla owner-ów (kliknij Połącz bank → wybierz bank → zaloguj się → wybierz konta → gotowe; nic o GC od strony usera) + sekcja "Setup admina apki" (jak zarejestrować się u GC, dodać klucze do Workers secrets, limity free tier, kiedy upgrade). (2) Polityka prywatności — wymienić GoCardless Ltd. jako data processor dla danych bankowych, jakie dane są transmitowane (IBAN, transakcje 90d), retention, podstawę prawną (zgoda usera + PSD2). Dodać checkbox zgody przy pierwszym podpinaniu banku linkujący do polityki.

### Acceptance criteria

- [ ] README sekcja "Sync z bankiem (opcjonalne)" — owner-facing
- [ ] README sekcja "Setup admina" — admin-facing, kroki rejestracji GC + Workers secrets
- [ ] Polityka prywatności zaktualizowana o GoCardless jako data processor, retention, podstawa prawna
- [ ] Checkbox zgody przy pierwszym podpinaniu banku — zapamiętany w DB (per user, nie per household)
- [ ] Screenshots flow w README (połączenie banku, inbox, badge) — generowane z dev środowiska

---

## Sequencing

```
Phase 1 (Setup admina)
   │
   ├──────▶ Phase 2 (Podpinanie)
   │           │
   │           └──────▶ Phase 3 (Sync + inbox + badge)
   │                       │
   │                       ├──────▶ Phase 4 (Reguły + dedupe + skip)
   │                       │
   │                       └──────▶ Phase 5 (Re-auth flow)
   │
   └──────▶ Phase 6 (Docs + privacy) — może toczyć się równolegle z 4 i 5
```

Phase 1 → 2 → 3 są strictly sekwencyjne. Phase 4 i 5 mogą być w dowolnej kolejności po Phase 3 (są niezależne od siebie). Phase 6 można robić częściowo równolegle z każdą inną fazą (kawałki README pisać przy okazji ukończenia danej fazy), ale finalny shipping na main wymaga ukończenia 1-5.

## Estymata (luźna, dla pojedynczego dewa)

| Phase | Estymata |
|---|---|
| 1 | 1-2 dni |
| 2 | 4-6 dni |
| 3 | 6-9 dni |
| 4 | 3-5 dni |
| 5 | 3-4 dni |
| 6 | 2-3 dni |

Suma: **~3-5 tygodni** full-time, realistycznie 6-8 tyg part-time.
