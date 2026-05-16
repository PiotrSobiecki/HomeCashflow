# PRD: Multi-Device Sync + Per-Row Endpoints + Undo

> Status: planowane (po stabilizacji migracji do tabel relacyjnych, którą wdrożyliśmy w maju 2026)
> Wersja: v2 (po sesji /ask)
> **Out of scope:** sprzątanie po starym JSON-blobie (`finance_data` table, dead crypto)

## Problem Statement

Mam aplikację do budżetu domowego ze wspólnymi gospodarstwami. **Używam jej z partnerką codziennie
na różnych urządzeniach równolegle i regularnie nadpisujemy sobie zmiany** — partnerka dodaje
wpis, a ja w tym czasie z drugiego urządzenia robię edycję ze starym snapshotem stanu i jej wpis
znika bez śladu. To realny pain point #1 obecnej aplikacji, nic innego mi bardziej nie przeszkadza.

Konkretne symptomy:

1. **Last-write-wins / ciche utraty danych.** Frontend wysyła cały aktualny stan w jednym PUT-cie
   po każdej akcji. Drugi PUT z innego urządzenia (które miało stary snapshot) nadpisuje
   wszystko. Nikt nie dostaje sygnału że coś znikło.
2. **Brak świadomości zmian na drugim urządzeniu** — żeby zobaczyć co partnerka dodała, muszę
   ręcznie zrobić refresh.
3. **Brak undo** — jak już dane przepadną, nie ma jak ich odzyskać poza ręcznym wpisaniem.

Migracja do schematu relacyjnego z maja 2026 (zrobiona) stworzyła fundament, ale samo
zastąpienie storage'u nic nie zmieniło dla użytkownika — PUT/GET dalej operują na całym stanie.

## Solution

Cztery spięte zmiany, w tej kolejności:

1. **Per-row endpointy w backendzie** — CRUD per rekord (transakcja, konto oszczędnościowe, budżet
   kategorii itd.). Każda mutacja dotyka jednego wiersza, nie całego drzewa. Stary PUT /api/finance
   znika.

2. **Optimistic concurrency control** — każdy wiersz ma `updated_at`. Mutacje PATCH/DELETE wysyłają
   `If-Match: <updated_at>`. Serwer porównuje z aktualnym stanem; jeśli rozbieżność → 409 Conflict.
   To **twarda blokada** zgodnie z decyzją: lepiej zmusić usera do refreshu niż zezwolić na ciche
   nadpisanie. Frontend pokazuje dialog z dwoma opcjami: "Nadpisz mimo to" / "Anuluj i pokaż
   aktualne dane".

3. **Polling-based sync** — frontend co ~30 sekund (gdy tab widoczny) wykonuje GET /api/finance
   i odświeża stan. Bez WebSocketów / SSE — polling wystarcza dla 30-sekundowego SLA i jest
   bezstanowy. Zaakceptowana lag: do 30s między urządzeniami.

4. **Undo dla ostatnich 20 akcji household (persistentne, globalne)** — backend trzyma audit-log
   z odwracalnymi operacjami. Każdy członek household widzi pełną listę 20 ostatnich akcji
   (czyje, kiedy, co) i może wywołać undo. Po undo, undone-akcja znika z listy i pojawia się
   nowa akcja "X cofnął Y". Stack jest persistentny — przeżywa reload, działa między
   urządzeniami.

Po tej czwórce: partnerka dodaje wydatek z telefonu, ja w kompie widzę go w ciągu 30s. Jeśli
oboje edytujemy ten sam wpis — 409 zmusi do świadomego wyboru. Jeśli partnerka skasuje
zachowane wydatki — jednym kliknięciem cofamy.

## User Stories

1. Jako użytkownik, chcę dodać wydatek na telefonie i zobaczyć go na komputerze w ciągu ≤30s,
   bez ręcznego odświeżania.

2. Jako użytkownik, chcę żeby jednoczesne edycje z dwóch urządzeń nie powodowały utraty żadnego
   z wpisów — każda transakcja żyje w swoim wierszu i nie nadpisuje innych.

3. Jako użytkownik, jeśli próbuję edytować wpis który ktoś inny zmienił równolegle ze mną, chcę
   dostać dialog "ten wpis został zmieniony przez X" z opcją nadpisania mimo to lub anulowania.

4. Jako użytkownik, chcę móc kliknąć "cofnij" na ostatniej akcji (mojej lub partnerki) i
   przywrócić poprzedni stan tej zmiany.

5. Jako użytkownik, chcę widzieć listę 20 ostatnich akcji w household (kto, kiedy, co) z możliwością
   cofnięcia każdej z nich.

6. Jako użytkownik, chcę żeby kliknięcie "Dodaj" było odczuwalnie szybkie — bez czekania na
   zaszyfrowanie i zapis całego drzewa danych.

7. Jako użytkownik, chcę żeby usunięcie pozycji na telefonie zniknęło z komputera w ciągu 30s
   bez ręcznego refresh.

8. Jako użytkownik, chcę żeby aplikacja działała tak samo gdy zamknę kartę i otworzę ponownie
   po tygodniu — pełny stan ma być załadowany z serwera.

9. Jako użytkownik, chcę żeby błąd sieci przy zapisie pojedynczej transakcji nie zepsuł reszty
   moich danych (rollback lokalnego stanu, komunikat o błędzie).

10. Jako użytkownik, chcę żeby polling nie zżerał baterii ani transferu gdy karta jest schowana
    (tylko aktywna karta odpytuje).

11. Jako użytkownik gospodarstwa wspólnego, chcę widzieć w logu aktywności kto i kiedy zrobił
    zmianę, plus móc kliknąć "cofnij" na cudzej akcji.

12. Jako użytkownik gościnny (tryb localStorage), chcę żeby moje doświadczenie się nie zmieniło —
    polling/undo są no-op w trybie gościa, mutacje dalej zapisują do localStorage.

13. Jako użytkownik, gdy mam otwarty formularz edycji i w tle przyjdzie polling z nowymi danymi,
    chcę żeby moje wpisane dane nie zniknęły — polling kolejkuje refresh do momentu zamknięcia
    formularza.

14. Jako użytkownik na wolnym łączu, chcę żeby pojedyncza mutacja PATCH/POST była mniejsza niż
    dotychczasowy PUT całego stanu.

15. Jako deweloper, chcę mieć testy backendu pokrywające każdy nowy endpoint plus scenariusze
    409/undo, odpalane na osobnym branchu Neona.

## Implementation Decisions

### Backend — per-row endpointy

- **Zasoby i operacje:**
  - `transactions` — POST (create), PATCH (update), DELETE
  - `savings-accounts` — POST, PATCH, DELETE
  - `category-budgets` — POST, PATCH, DELETE
  - `savings-goal` — singleton per household, PUT (upsert)
  - `deleted-fixed-items` — zarządzane implicite przy DELETE transakcji o `isFixed=true`
- **GET /api/finance pozostaje** — używany przy initial load i przy każdym pollu. Zwraca cały
  zagregowany stan w tym samym kształcie co dziś.
- **Stary PUT /api/finance znika** — clean cut, bez backward compat.
- **Autoryzacja:** każdy endpoint sprawdza że user należy do household, którego dotyczy zasób.
  Reuse istniejącego `authMiddleware`.
- **Szyfrowanie:** mutacje używają `encryptField`/`decryptField` z `finance-crypto.js`.

### Backend — optimistic concurrency control

- **Każdy wiersz w transactions/savings_accounts/category_budgets/savings_goals dostaje już
  istniejącą kolumnę `updated_at`.**
- **PATCH i DELETE wymagają nagłówka `If-Match: <updated_at-from-last-GET>`.**
- **Server:** jeśli `If-Match` nie matchuje aktualnego `updated_at` w bazie → response 409 z
  body `{ error: "conflict", current: <full-current-row> }`. Klient dostaje świeży stan w
  jednym round-tripie.
- **Domyślne zachowanie POST i PUT singleton-ów:** bez optimistic check (nowy zasób nie ma
  poprzedniej wersji; singleton goal — last-write-wins akceptowalne bo to jedno-pole-edycja).

### Backend — undo

- **Nowa tabela `action_log`** (osobno od istniejącego `activity_log` — `activity_log` jest do
  wyświetlania historii, ten ma odwracalne operacje):
  - `id UUID PK`
  - `household_id UUID FK`
  - `actor_id UUID FK users`
  - `at TIMESTAMPTZ`
  - `operation TEXT` (CREATE/UPDATE/DELETE)
  - `resource_type TEXT` (transaction/savings_account/category_budget/savings_goal)
  - `resource_id UUID`
  - `before JSONB NULL` (poprzedni stan rekordu — przy UPDATE i DELETE; szyfrowane sensytywne pola
    tak jak w docelowych tabelach)
  - `after JSONB NULL` (nowy stan rekordu — przy CREATE i UPDATE)
  - `undone_at TIMESTAMPTZ NULL` (gdy operacja została cofnięta)
  - `undone_by UUID NULL FK users`
- **Rotacja:** trigger / scheduled cron usuwa wpisy starsze niż 20 najnowszych per household.
  (Alternatywa: trzymać wszystkie, paginować — zdecydować w czasie implementacji w zależności od
  rozmiarów payloadu).
- **Endpoint `POST /api/action-log/:id/undo`:**
  - Pobiera wpis z `action_log`
  - Wykonuje odwrotną operację:
    - undo CREATE → DELETE zasobu po `resource_id`
    - undo UPDATE → UPDATE zasobu wartościami z `before`
    - undo DELETE → INSERT zasobu z wartościami `before` (z zachowaniem `resource_id` jeśli
      konflikt — wygeneruj nowy UUID, zaktualizuj odpowiednio)
  - Tworzy nowy wpis w `action_log` (operacja "undo X")
  - Zaznacza oryginalny wpis jako `undone_at = NOW()`, `undone_by = user.id`
  - Edge case: jeśli zasób po którym chcemy undo już nie istnieje (np. ktoś inny też go skasował) —
    operacja idempotentna, zwróć 200 z komunikatem "już cofnięte"
- **Endpoint `GET /api/action-log`** — zwraca ostatnie 20 wpisów (nie tylko nie-undone) z
  informacją kto i kiedy.

### Backend — aktualizacja `households.updated_at`

- Każda mutacja per-row bumpuje `households.updated_at` (nowa kolumna — migracja Drizzle 0002).
- GET /api/finance może w przyszłości wspierać `If-Modified-Since` żeby polling zwracał 304
  gdy nic się nie zmieniło. **W pierwszej iteracji nie implementujemy 304** — premature
  optimization dla 6 gospodarstw.

### Frontend — refactor `useFinanceData`

- **Per-akcja API call zamiast `saveData(całyStan)`:**
  - `addIncome` → POST /api/transactions
  - `updateIncome` → PATCH /api/transactions/:id (z `If-Match`)
  - `deleteIncome` → DELETE /api/transactions/:id (z `If-Match`)
  - analogicznie dla expense / savings / categories / goal
- **Optymistyczny update lokalnego stanu** — natychmiastowy update React state, mutacja w tle.
  Przy 4xx/5xx: rollback (przywrócenie poprzedniego stanu) + toast.
- **Initial load** — GET /api/finance (jak dziś), wynik trafia do React state.
- **Tryb gościa** — bez zmian (localStorage, brak API, brak undo).

### Frontend — polling

- **Interval:** 30s. Hard-coded.
- **Page Visibility API** — polling pauzuje gdy `document.hidden`. Wznawia z natychmiastowym GET
  gdy karta wraca.
- **Skip podczas trwającej mutacji** — race-condition protection.
- **Skip gdy otwarty formularz / modal** — sprawdzenie czy istnieje aktywny formularz w drzewie
  React (przez kontekst lub flag). Polling kolejkuje refresh i odpala po zamknięciu formularza.
- **Pełne zastąpienie stanu** — odpowiedź pollingu zastępuje cały stan lokalny. Aktualne formularze
  zachowują własny lokalny state (kontrolowane inputs).

### Frontend — UX 409

- Po 409 z `current` w body:
  - Dialog modal: tytuł "Ktoś inny zmienił ten wpis" + treść "Twoje zmiany: X / Aktualne na
    serwerze: Y" + dwa przyciski: "Nadpisz mimo to" (kolejny PATCH z świeżym `updated_at` z
    `current`) / "Anuluj i pokaż aktualne" (zastąp lokalny stan świeżym `current`).
  - Domyślnie focus na "Anuluj" (bezpieczniejsze).

### Frontend — undo

- **Komponent UI: lista 20 ostatnich akcji** (zastąpi obecny `activity_log` UI, używając danych
  z nowego `action_log`).
- Każdy wpis ma:
  - User (z avatar i nazwą)
  - Czas (np. "2 min temu")
  - Opis ("Dodał wydatek 'Lunch' 50 PLN" / "Edytował 'Czynsz' z 1500 na 1600" / "Usunął
    'Netflix' 39 PLN")
  - Przycisk "Cofnij" (disabled jeśli `undone_at != null` — zamiast tego: "Cofnięte przez X")
- **Klawiszowy skrót `Ctrl+Z`** — cofa najnowszą akcję bieżącego użytkownika (nie cudzą).
- **Optymistyczny update przy undo:** ukryj wpis ze stacku / wyszarz, odśwież dane po
  odpowiedzi serwera (pełny GET albo aktualizacja per-zasób z odpowiedzi POST /undo).

### Testy

- **Osobny Neon branch dla testów** — dodać `DATABASE_URL_TEST=postgresql://…test_branch…`.
  Test setup ładuje ten URL zamiast dev-owego.
- **Per-endpoint integration testy:** POST/PATCH/DELETE każdego zasobu, plus 401 / 403 /
  404 / 400 / 409.
- **Undo testy:** create + undo, update + undo, delete + undo. Plus podwójne undo (idempotencja).
- **Polling testy (jednostkowo, mocked fetch):** interval, Page Visibility, skip during mutation,
  skip when form open.
- **Smoke test e2e (manualnie po deploy):** dwie karty, edycja konfliktowa (409 dialog), undo
  cudzej akcji.

### Database migracje (Drizzle)

- Migracja 0002:
  - `households.updated_at TIMESTAMPTZ DEFAULT NOW()` (bump przy każdej mutacji)
  - Nowa tabela `action_log` (schema powyżej)

## Validation Strategy

- **User story #1, #2, #7 (multi-device sync):** dwie karty na to samo konto. Akcja w pierwszej
  → w ciągu ≤30s widoczna w drugiej.
- **User story #3 (409):** dwie karty, edytuj ten sam wpis w obu, kliknij Zapisz na obu →
  drugi dostaje 409 dialog. Sprawdź obie ścieżki ("Nadpisz" i "Anuluj").
- **User story #4, #5, #11 (undo):** wykonaj akcję → kliknij "Cofnij" → sprawdź że stan
  przywrócony. Cofnij cudzą akcję z drugiego konta → sprawdź że oba urządzenia widzą efekt.
- **User story #6 (szybkość):** PATCH/POST pojedynczej transakcji średnio <300ms.
- **User story #8 (full reload):** zamknij/otwórz aplikację → wszystkie dane obecne.
- **User story #9 (error rollback):** symulacja offline → mutacja → lokalny stan wraca, toast.
- **User story #10 (battery / transfer):** schowaj kartę → po minucie sprawdź że żaden fetch
  się nie wykonał.
- **User story #13 (form protection):** otwórz formularz edycji → poczekaj 60s → sprawdź że
  wpisane dane nie zniknęły mimo przyjścia pollingu z nowymi danymi.
- **Backend coverage:** wszystkie nowe endpointy mają testy integracyjne pokrywające happy
  path + auth + 404 + 400 + 409.
- **Backend regression:** istniejące testy dalej zielono.
- **"Done" dla całej zmiany:**
  - Backend zdeployowany, wszystkie testy zielone na test-branch
  - Frontend zdeployowany, smoke testy ręczne udane
  - Przez 48h normalnego użytku z partnerką: zero raportów o zniknięciu danych

## Out of Scope

- **Sprzątanie po starym JSON-blobie:** kolumna `finance_data.data` zostaje (jako backup),
  funkcje `encryptFinancePayload` / `parseStoredFinanceData` zostają. Drop wykonamy osobnym
  krokiem po ~2 tygodniach stabilnego działania nowego stack'a.
- **SSE / WebSocket / Durable Objects** — polling 30s wystarcza.
- **Conflict merge UI (3 opcje "zachowaj moje / cudze / scal")** — wybraliśmy prostsze 2 opcje
  ("nadpisz / anuluj"). Jeśli po wdrożeniu okaże się że konfliktów jest dużo i merge byłby
  cenny — osobny PRD.
- **Granulacja 409 per pole / per znaczenie** — wszystkie konflikty traktujemy tak samo
  (twarda blokada). Jeśli okaże się męczące przy drobiazgach — re-evaluate.
- **Pełna historia akcji (>20)** — trzymamy tylko 20 najnowszych per household. Starsze
  rotowane.
- **Undo cudzego undo (re-do)** — nie wspieramy. Cofnięta operacja jest oznaczona jako
  cofnięta i nie da się jej już "od-cofnąć".
- **Server-side aggregations** (np. `GET /api/finance/summary?month=5`) — frontend dalej liczy
  sumy w JS po pełnym GET.
- **Per-user preferencje (interval pollingu, theme, język)** — hard-coded.
- **Bulk-import endpoint (CSV / Excel)** — out of scope.
- **Realtime obecność ("partnerka teraz edytuje")** — out of scope.

## Decyzje wymagające potwierdzenia

Rzeczy które uznałem domyślnie w v2 bez explicit twojego "tak", flag-uję żebyś mógł szybko poprawić:

1. **Undo: persistentny globalny, ostatnich 20 akcji** (vs lokalny tylko-moje-tylko-sesja).
   Wybrałem tak bo daje realny use-case "partnerka skasowała moje wpisy". Jeśli to za dużo —
   downgrade do lokalnego.

2. **409 UX: dialog z 2 przyciskami ("Nadpisz" / "Anuluj+załaduj")** (vs toast + automatyczny
   reload). Wybrałem tak bo daje user agency. Jeśli chcesz prościej — toast+reload.

3. **Granulacja 409: każdy konflikt** (vs tylko DELETE / tylko "znaczące" pola). Wybrałem
   konsystentnie. Może okazać się męczące — wtedy zmniejszamy zakres.

4. **Activity log → zastąpione przez action_log z undo** vs trzymanie dwóch równoległych
   tabel. Wybrałem zastąpienie. Konsekwencja: stara struktura `activityLog` w state'cie
   znika, UI pokazuje wpisy z action_log.

## Plan rolloutu

1. **Faza 1: Backend per-row + 409**
   - Migracja Drizzle 0002 (households.updated_at, action_log)
   - Endpointy POST/PATCH/DELETE per zasób
   - Optimistic concurrency w PATCH/DELETE
   - Testy integracyjne na test-branch
   - Deploy (PUT /api/finance dalej działa równolegle)

2. **Faza 2: Backend undo**
   - Zapisy do action_log w mutacjach z fazy 1
   - Endpoint POST /api/action-log/:id/undo, GET /api/action-log
   - Testy
   - Deploy

3. **Faza 3: Frontend refactor**
   - Hook useFinanceData → per-row calls + optimistic
   - Polling 30s
   - Dialog 409
   - UI undo (lista akcji + Ctrl+Z)
   - Deploy

4. **Faza 4: Backend cleanup**
   - Usunięcie PUT /api/finance
   - Deploy

5. **Obserwacja 48h** z partnerką w warunkach codziennego użycia.

## Further Notes

- **Polling cost na Neon:** 6 gospodarstw × ~2 użytkowników × poll co 30s = ~24 GET/min,
  ~35k zapytań/dzień. Neon free tier wytrzymuje z zapasem.
- **Rozmiar `action_log`:** każdy wpis to ~kilkaset bajtów (JSON before/after). 20 wpisów ×
  6 gospodarstw = mała tabela, nieistotny narzut.
- **Backward compatibility frontendu:** brak. Po deploy frontendu starszy frontend
  w niezamkniętej karcie przestanie działać. Frontend + backend muszą być w jednym oknie.
- **Migracja danych:** żadna nie wymagana. Tabele relacyjne już są wypełnione.
- **Hook może wymagać większego refactoru niż tylko CRUD-y:** auto-przenoszenie fixed items,
  computed values (savingsGoalData, guiltFreeBurn) zostają jako derivations. Zmienia się tylko
  sposób triggerowania mutacji.
