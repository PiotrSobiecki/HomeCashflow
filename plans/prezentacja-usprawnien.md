# HomeCashflow — co usprawniono względem v1

Krótki przegląd zmian wdrożonych względem pierwotnej wersji aplikacji
(Supabase + logowanie email/hasło + dane per-user). Wszystko poniżej jest
już na `main` lub w otwartym PR #13.

---

## Migracja platformy (v1 → v2)

- **Supabase → Neon PostgreSQL + Hono na Cloudflare Workers**
  Cała warstwa backendu napisana od nowa w `server/` (Hono + Drizzle ORM),
  frontend deployowany na Cloudflare Pages. `@supabase/supabase-js` do usunięcia
  z dependencies.

- **Logowanie email/hasło → Google OAuth 2.0 + JWT w httpOnly cookie**
  Brak haseł w aplikacji, sesja przeżywa odświeżenie strony.
  (Email/hasło wraca jako alternatywa w osobnym TODO, `plans/todo-email-auth.md`.)

- **Per-user data → wspólne gospodarstwa (households)**
  Jeden zestaw danych finansowych dla pary/rodziny zamiast oddzielnych kont.
  Tabele `households`, `household_members`, role owner vs member.

- **Zaproszenia mailem (Resend)**
  Owner wysyła linki na email, zaproszona osoba loguje się Google i dołącza.

- **Tryb gościa**
  Bez logowania — localStorage. Po zalogowaniu dane gościa migrują do DB.

---

## Bezpieczeństwo i schemat bazy

- **Migracja na schemat relacyjny (maj 2026)**
  Stara tabela `finance_data` (jeden wiersz na household, cały stan w jednej
  kolumnie tekstowej) → osobne tabele `transactions`, `savings_accounts`,
  `category_budgets`, `savings_goals`, `deleted_fixed_items`, `activity_log`.
  Pozwala to operować na pojedynczym wierszu zamiast nadpisywać cały stan.

- **Column-level encryption (AES-256-GCM)**
  Sensytywne pola (nazwy, kwoty) szyfrowane per-kolumna kluczem
  `FINANCE_DATA_KEY`. Plaintext zostaje tylko tam, gdzie potrzebny do
  filtrowania (daty, kategorie, household_id).

- **Tooling Drizzle Kit**
  Migracje wersjonowane w `server/drizzle/`, osobne komendy dla dev/test/prod
  brancha Neon (`npm run drizzle:dev:migrate`, `:test:migrate`, `:prod:migrate`).

- **Test branch Neon + Vitest na bazie integracyjnej**
  Testy walą po prawdziwej bazie (osobny branch), bez mocków DB.
  Flaga `ALLOW_VITEST_DB_WIPE` chroni przed pomyłką na dev/prod.

---

## Multi-device sync (z planu `multi-device-sync.md`)

Rozwiązanie pain pointu: cichy nadpis zmian gdy dwa urządzenia edytują równolegle.

### Phase 1 — Per-row endpointy + 409 dialog (PR #9)

- **`POST/PATCH/DELETE /api/transactions/:id`** zamiast wysyłania całego stanu.
  Payload pojedynczej akcji to setki bajtów zamiast kilobajtów.

- **Optimistic concurrency (`If-Match: <updated_at>`)**
  Edycja ze starym snapshotem → 409 Conflict z aktualnym stanem w odpowiedzi.

- **`ConflictDialog`** — UI z opcjami "Nadpisz mimo to" / "Anuluj i pokaż aktualne".

### Phase 2 — Polling sync co 30s (PR #10)

- **`usePolling` hook** — `GET /api/finance` co 30 sekund gdy tab aktywny.

- **Page Visibility API** — gdy tab ukryty, polling stoi (oszczędność baterii
  i transferu). Powrót do tabu = natychmiastowy fetch.

- **Ochrona otwartych formularzy** — polling kolejkuje refresh do zamknięcia
  modalu, żeby nie skasować wpisanych danych.

### Phase 3 — Per-row dla pozostałych zasobów (PR #12)

- **Per-row endpointy** dla `savings_accounts`, `category_budgets`, `savings_goal`.

- **Frontend hook przepięty w całości** — `PUT /api/finance` nie jest już
  używany przez UI podczas normalnej pracy.

### Phase 4 — Undo end-to-end (PR #13)

- **Tabela `action_log` z rotacją do 20 wpisów per household**
  Każda mutacja zostawia snapshot `before`/`after` (ciphertext zachowany —
  undo nie musi deszyfrować).

- **`GET /api/action-log`** — lista 20 ostatnich akcji z autorem, czasem i opisem.

- **`POST /api/action-log/:id/undo`** — odwraca operację (CREATE→DELETE,
  UPDATE→przywróć before, DELETE→INSERT z zachowaniem id). Idempotentny:
  drugie undo zwraca 200 z notyfikacją.

- **UI `ActionLog`** z przyciskami **Cofnij** przy każdym wpisie.

- **Hotkey Ctrl+Z** cofa najnowszą własną akcję (ignoruje gdy focus w inpucie).

- **Uprawnienia:** owner gospodarstwa cofa dowolny wpis, member tylko własny.

---

## Co dalej

- **Phase 5: cleanup `PUT /api/finance`** — usunięcie starego endpointu i
  martwego kodu `encryptFinancePayload` / `parseStoredFinanceData`.
  Frontend już go nie wywołuje.

- **Drop tabeli `finance_data`** (legacy backup po migracji maj 2026) — ~2
  tygodnie po stabilnym Phase 5.

- **Logowanie email + hasło** (`plans/todo-email-auth.md`) — alternatywa dla
  Google, planowane.
