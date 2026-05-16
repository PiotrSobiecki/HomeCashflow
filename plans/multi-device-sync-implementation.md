# Plan: Multi-Device Sync + Per-Row Endpoints + Undo — Implementation

> Source PRD: `plans/multi-device-sync.md` (v2, po sesji /ask)

## Architectural decisions

Decyzje wspólne dla wszystkich faz, ustalone w PRD:

- **Architecture style:** Frontend React + Vite (Cloudflare Pages). Backend Hono (Cloudflare Workers).
  Baza Neon Postgres. Bez SSE/WebSocket — polling 30s.
- **Data model:** Tabele relacyjne (po migracji z maja 2026): `transactions`, `savings_accounts`,
  `category_budgets`, `savings_goals`, `deleted_fixed_items`, `activity_log`, `users`,
  `households`, `household_members`, `invitations`. Sensytywne pola (kwoty, nazwy) szyfrowane
  column-level AES-256-GCM kluczem `FINANCE_DATA_KEY`. Plus dodawana w fazach: kolumna
  `households.updated_at` (sync hint, niewykorzystywana w tym planie ale wbudowana w mutacje)
  oraz nowa tabela `action_log` (undo).
- **Key entities:** household (granica autoryzacji i sync), transaction, savings_account,
  category_budget, savings_goal (singleton per household), action_log entry (operacja
  z reverse-payload).
- **Auth:** Google OAuth → JWT w httpOnly cookie. Reuse istniejącego `authMiddleware`.
  Każdy endpoint sprawdza że user należy do household zasobu.
- **Optimistic concurrency:** PATCH/DELETE wymagają nagłówka `If-Match: <updated_at>`. Server
  zwraca 409 z aktualnym stanem rekordu w body. POST i PUT singleton-ów bez check'u (last-write-wins
  akceptowalne).
- **Migracje schematu:** Drizzle Kit, jeden wspólny folder `server/drizzle/`. Komendy
  `npm run drizzle:dev:generate` / `:dev:migrate` / `:prod:migrate`. Każda faza która zmienia
  schemat dodaje nowy plik migracji (np. `0002_xxx.sql`, `0003_xxx.sql`).
- **Testy backendu:** Vitest, na osobnym branchu Neona (zmienna `DATABASE_URL_TEST`). Test-setup
  ładuje ten URL zamiast dev-owego. Flaga `ALLOW_VITEST_DB_WIPE=yes` tylko dla test-brancha.
- **Stabilność rolloutu:** Stary endpoint `PUT /api/finance` żyje równolegle z nowymi per-row
  endpoints aż do ostatniej fazy. Frontend stopniowo przerzuca operacje na nowe ścieżki. To
  pozwala zdeployować częściowe zmiany bez breaking change.
- **Out of scope całego planu:** drop tabeli `finance_data`, usunięcie dead-crypto
  (`encryptFinancePayload` / `parseStoredFinanceData`). To osobny krok ~2 tygodnie po zakończeniu
  tego planu.

---

## Phase 1: Transakcje end-to-end (per-row CRUD + 409 dialog)

**User stories:** #2 (brak utraty wpisów), #3 (dialog 409), #6 (szybkość pojedynczego zapisu),
#9 (rollback przy błędzie sieci), #14 (mały payload)

### What to build

Dla zasobu `transactions` (przychody i wydatki) pełna ścieżka per-row:

- Backend wystawia endpointy do tworzenia, edycji i usuwania pojedynczej transakcji w danym
  household. Edycja i usunięcie wymagają potwierdzenia świeżości stanu — klient wysyła znacznik
  ostatnio widzianej wersji rekordu, server porównuje, w razie rozbieżności zwraca konflikt
  z aktualnym stanem rekordu w body.
- Frontend hook obsługujący wydatki/przychody zamiast wysyłać cały stan, woła konkretne endpointy
  per akcja użytkownika. Lokalny stan jest aktualizowany optymistycznie, przy błędzie 4xx/5xx
  rollback i toast z komunikatem.
- W przypadku 409 (konflikt równoległej edycji) frontend pokazuje dialog modalny z dwoma
  opcjami: "Nadpisz mimo to" (kolejny PATCH ze świeżym znacznikiem z odpowiedzi serwera) lub
  "Anuluj i pokaż aktualne" (zastąp lokalny stan świeżą wersją z serwera). Domyślny focus na
  "Anuluj".
- Pozostałe zasoby (oszczędności, budżety kategorii, cel oszczędnościowy) dalej obsługiwane przez
  stary `PUT /api/finance`.

### Acceptance criteria

- [ ] Można dodać/edytować/usunąć transakcję bez wysłania całego stanu (sprawdzalne w devtools
      Network — payload pojedynczej akcji jest setki bajtów, nie kilobajty)
- [ ] Dwie karty zalogowane na to samo konto: edycja tej samej transakcji w obu → drugi save
      zwraca 409, frontend pokazuje dialog
- [ ] Symulacja offline w devtools podczas PATCH transakcji → lokalny stan wraca do poprzedniego,
      pokazuje się toast
- [ ] Średni czas PATCH transakcji <300ms (devtools Network)
- [ ] Testy integracyjne backend pokrywają: happy path POST/PATCH/DELETE, 401 (brak auth), 403
      (cudze household), 404 (nieistniejący rekord), 400 (walidacja), 409 (stary `If-Match`)
- [ ] Istniejące testy (auth, household, invitations) dalej zielono
- [ ] Stary `PUT /api/finance` dalej działa dla pozostałych zasobów (smoke test: zmiana salda
      konta oszczędnościowego dalej zapisuje się przez stary endpoint)

---

## Phase 2: Polling sync między urządzeniami

**User stories:** #1 (lag ≤30s), #7 (usunięcia widoczne ≤30s), #8 (full reload state),
#10 (battery/transfer), #13 (form protection)

### What to build

Frontend cyklicznie pobiera stan z `GET /api/finance` i podmienia lokalny state, dzięki czemu
zmiany z drugiego urządzenia stają się widoczne bez ręcznego refresh:

- Aktywny tab odpytuje co 30 sekund. Tab niewidoczny (Page Visibility API: `document.hidden`)
  nie odpytuje wcale. Powrót do tabu wywołuje natychmiastowy fetch żeby nadgonić ewentualne
  zmiany sprzed wznowienia.
- Polling jest pomijany w dwóch sytuacjach:
  - aktualnie leci mutacja użytkownika (race: poll mógłby pobrać stan zanim mutacja się zapisze),
  - użytkownik ma otwarty formularz/modal edycji (refresh zniszczyłby wpisane dane —
    polling kolejkuje refresh do zamknięcia formularza).
- Pełna odpowiedź pollingu zastępuje lokalny stan. Kontrolowane inputy w aktualnie otwartych
  formularzach trzymają własny stan i nie są nadpisywane.

Backend bez zmian — `GET /api/finance` istnieje i działa.

### Acceptance criteria

- [ ] Dwie karty zalogowane na to samo konto: dodanie transakcji w pierwszej → druga widzi
      w ≤30s bez ręcznego refresh
- [ ] Usunięcie transakcji widoczne w drugiej karcie w ≤30s
- [ ] Schowanie karty (przełączenie na inną aplikację) na minutę → w devtools Network zero
      fetchy w tym czasie
- [ ] Powrót do tabu po ukrytym okresie → natychmiastowy fetch widoczny w Network
- [ ] Otwarcie formularza edycji transakcji + odczekanie 60s → wpisane dane dalej są w
      formularzu (polling nie zniszczył)
- [ ] Mutacja jednoczesna z momentem polling → mutacja nie jest porzucona, odpowiedź serwera
      poprawnie aktualizuje stan
- [ ] Tryb gościa: polling jest no-op (zero fetchy w devtools)

---

## Phase 3: Per-row dla pozostałych zasobów

**User stories:** #2, #3, #6 (rozszerzenie ze slice'a 1 na pozostałe zasoby)

### What to build

Powtórzenie patternu ze slice'a 1 dla pozostałych zasobów: kont oszczędnościowych, budżetów
kategorii, celu oszczędnościowego. Po tej fazie cała aplikacja używa per-row endpoints —
`PUT /api/finance` nie jest już używany przez frontend (zostaje na backendzie do slice'a 5).

- Konta oszczędnościowe: tworzenie, edycja, usunięcie pojedynczego konta przez dedykowane
  endpointy z optimistic concurrency.
- Budżety kategorii: analogicznie.
- Cel oszczędnościowy: singleton per household, wystawiony jako upsert (PUT). Bez `If-Match`
  bo to praktycznie pojedyncze pole konfiguracyjne.
- Frontend hook przerzucony w całości na per-row calls. Dialog 409 reużywany.
- Activity log wpisy generowane serwerowo (każda mutacja tworzy odpowiedni wpis) — frontend
  nie wysyła już swoich wpisów aktywności.

### Acceptance criteria

- [ ] Dodanie/edycja/usunięcie konta oszczędnościowego, budżetu kategorii, ustawienie celu —
      wszystkie idą przez per-row endpointy (devtools Network: zero wywołań `PUT /api/finance`
      podczas normalnego użycia)
- [ ] Konflikt równoległej edycji konta oszczędnościowego z dwóch urządzeń → 409 dialog
- [ ] Activity log w UI dalej pokazuje wszystkie akcje (teraz generowane serwerowo)
- [ ] Wszystkie testy integracyjne backend pokrywają nowe endpointy: happy path + auth + 404 +
      400 + 409 dla każdego zasobu
- [ ] Smoke test: pełne użycie aplikacji przez 5 minut (dodaj kilka wydatków, edytuj cel,
      dodaj kategorię, zmień saldo oszczędności) bez ani jednego wywołania `PUT /api/finance`

---

## Phase 4: Undo end-to-end (audit log + UI + Ctrl+Z)

**User stories:** #4 (cofnij ostatnią), #5 (lista 20 z opcją cofnięcia), #11 (cofnij cudzą)

### What to build

Backend zapisuje każdą mutację jako wpis w nowej tabeli `action_log` z odwracalnym payloadem
(snapshot przed + po). Frontend pokazuje listę ostatnich 20 akcji household z przyciskiem
"Cofnij" przy każdej oraz obsługuje skrót Ctrl+Z dla najnowszej akcji bieżącego użytkownika.

- Migracja schematu dodaje tabelę `action_log` ze strukturą opisaną w PRD (id, household_id,
  actor_id, at, operation, resource_type, resource_id, before/after JSONB z szyfrowaniem
  sensytywnych pól, undone_at, undone_by). Rotacja: tylko 20 najnowszych per household.
- Każda mutacja z faz 1 i 3 dopisuje wpis do `action_log` w tej samej transakcji.
- Endpoint do cofnięcia akcji wykonuje odwrotną operację (CREATE→DELETE, UPDATE→UPDATE z
  before, DELETE→INSERT z before), tworzy nowy wpis "X cofnął Y", zaznacza oryginalny jako
  cofnięty. Idempotentny: jeśli zasób już nie istnieje, zwraca 200 z notyfikacją "już cofnięte".
- Frontend wymienia obecny UI activity log na komponent oparty o `action_log`: każdy wpis
  pokazuje autora, czas, opis operacji i przycisk "Cofnij" (disabled jeśli już cofnięte —
  zamiast tego napis "Cofnięte przez X").
- Ctrl+Z cofa najnowszą akcję bieżącego użytkownika (nie cudzą — żeby nie zaskakiwać).

### Acceptance criteria

- [ ] Po dodaniu transakcji → "Cofnij" w UI usuwa ją; widać nowy wpis "X cofnął dodanie Y"
- [ ] Po edycji transakcji → "Cofnij" przywraca poprzednie wartości pól
- [ ] Po usunięciu transakcji → "Cofnij" tworzy rekord ponownie (z tym samym id jeśli możliwe,
      lub nowym jeśli jest konflikt)
- [ ] Lista pokazuje maks. 20 najnowszych wpisów per household
- [ ] Ctrl+Z na klawiaturze cofa najnowszą akcję bieżącego użytkownika (jeśli istnieje)
- [ ] Drugie urządzenie widzi cofniętą zmianę w ≤30s (przez polling)
- [ ] Klik "Cofnij" na cudzej akcji (np. partnerki) działa — sprawdzalne między dwoma kontami
      w tym samym household
- [ ] Próba cofnięcia już-cofniętej akcji zwraca 200 z notyfikacją (idempotencja)
- [ ] Testy integracyjne pokrywają: create+undo, update+undo, delete+undo, podwójne undo
      (idempotencja), undo na nieistniejący wpis (404)

---

## Phase 5: Cleanup PUT endpoint

**User stories:** brak (sprzątanie kodu, nie funkcjonalność)

### What to build

Po slice'ach 1-3 frontend już nie używa `PUT /api/finance`. Po slice'ie 4 mamy pełną
funkcjonalność per-row + undo. Czas usunąć stary endpoint z backendu.

- Backend: usunięcie handlera `PUT /api/finance` i zależnego kodu w `app.js`.
- Importy / pomocnicze funkcje używane tylko przez ten handler — wyczyść.
- Funkcje całego-bloba w `finance-crypto.js` (`encryptFinancePayload`, `parseStoredFinanceData`)
  **zostają** — pozostają potrzebne do odczytu tabeli `finance_data` (backup) gdyby trzeba było
  ratunku. Helpery per-pole (`encryptField`/`decryptField`) używane przez slice'y 1-4 pozostają.
- Frontend: brak zmian (już nie wywołuje).

Drop tabeli `finance_data` i usunięcie dead crypto pozostają **out of scope** całego planu
(decyzja PRD: po 2 tygodniach stabilnego działania, osobnym ruchem).

### Acceptance criteria

- [ ] `PUT /api/finance` zwraca 404 (handler usunięty)
- [ ] Wszystkie pozostałe endpointy (GET /finance, per-row mutations, undo) dalej działają
- [ ] Wszystkie testy zielono
- [ ] Smoke test produkcji: dodaj/edytuj/usuń kilka pozycji w UI, działa identycznie jak po
      slice'ie 4
- [ ] Tabela `finance_data` w bazie dalej istnieje z aktualnym (sprzed cleanup) snapshotem —
      jako bezpiecznik na wypadek konieczności rollbacku
