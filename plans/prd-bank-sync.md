## Problem Statement

Jako owner gospodarstwa muszę ręcznie wpisywać każdy wydatek (Biedronka, Orlen, Empik) i każdy przychód (pensja) do apki. To powtarzalne, czasochłonne i błędogenne — łatwo zapomnieć wpis albo pomylić kwotę. Skoro bank ma wszystko czarno na białym, chcę żeby transakcje same wpadały do mojego gospodarstwa: zapłacę kartą → wydatek pojawia się w apce, dostanę pensję → przychód pojawia się w apce.

## Solution

Integracja z PSD2 przez **GoCardless Bank Account Data API** (free tier, polskie banki). Owner gospodarstwa raz podpina swoje banki (PKO/ING/dowolny inny obsługiwany przez GC w Polsce) przez hosted page banku — bez wpisywania haseł w naszej apce. Co 4h cron pobiera nowe transakcje, filtruje śmieci (transfery wewnętrzne, bankomaty), próbuje skategoryzować przez reguły opisowe i ląduje wynik w **Inboxie** — tam owner przegląda i zatwierdza wpisy do budżetu (z opcją „zapamiętaj regułę: opis zawiera X → kategoria Y"). Po paru tygodniach większość kategoryzuje się automatycznie. Wpisy z banku mają badge `🏦 z banku` i mają zamrożoną kwotę/datę (bank to source of truth), edytowalna jest tylko kategoria i opis.

## User Stories

### Konfiguracja i podpięcie banku

1. Jako owner, chcę kliknąć „Połącz bank" na dashboardzie, żeby zobaczyć grid kafelków polskich banków z logami i wybrać swój.
2. Jako owner, po wyborze banku chcę zostać przekierowany na hosted page GoCardless gdzie zaloguję się do swojego banku, żeby moja apka nigdy nie widziała moich haseł bankowych.
3. Jako owner po powrocie z banku chcę zobaczyć listę swoich rachunków (osobiste, oszczędnościowe, walutowe) z checkboxami, żeby zaznaczyć tylko te z których chcę sync (np. tylko osobiste).
4. Jako owner chcę móc podpiąć więcej niż jeden bank (np. PKO + ING + mBank), bo trzymam pieniądze w różnych miejscach.
5. Jako owner chcę widzieć w ustawieniach gospodarstwa listę wszystkich podpiętych banków z ich statusem (aktywny / wygasa za X dni / wygasł / odwołany).
6. Jako owner chcę móc odłączyć dowolny bank jednym kliknięciem, żeby przestać go syncować (apka woła GC delete requisition + kasuje swoje powiązania).
7. Jako member gospodarstwa NIE chcę widzieć opcji podpinania banków — to wyłącznie sprawa ownera.

### Sync transakcji

8. Jako owner chcę żeby sync z banku odbywał się automatycznie w tle (co 4h), żeby transakcje pojawiały się bez mojej akcji.
9. Jako owner chcę móc kliknąć „Sync teraz" w ustawieniach żeby wymusić natychmiastowe pobranie nowych transakcji, kiedy się spieszę.
10. Jako owner chcę żeby przelew z mojego konta osobistego na moje konto oszczędnościowe NIE pojawiał się jako wydatek (transfer wewnętrzny po typie z banku → skip).
11. Jako owner chcę żeby wypłata z bankomatu NIE pojawiała się jako wydatek (po typie z banku → skip).
12. Jako owner chcę żeby kwoty dodatnie z banku trafiały do „przychodów", a ujemne do „wydatków" (proste rozpoznanie po znaku).

### Inbox — przegląd i kategoryzacja

13. Jako owner chcę widzieć ekran „Inbox" z listą zaproponowanych transakcji z banku zanim wejdą do mojego budżetu, żeby mieć kontrolę.
14. Jako owner chcę widzieć dla każdej propozycji: nazwę sklepu, kwotę, datę, sugerowaną kategorię (jeśli reguła zadziałała) i przyciski „Zatwierdź" / „Pomiń".
15. Jako owner chcę móc zatwierdzić wpis z innej kategorii niż sugerowana (dropdown przy zatwierdzaniu), na wypadek gdyby reguła była zła.
16. Jako owner gdy zatwierdzam wpis z konkretną kategorią chcę móc zaznaczyć „zapamiętaj: opis zawiera 'Biedronka' → Żywność", żeby kolejne podobne transakcje były auto-kategoryzowane.
17. Jako owner chcę żeby reguła stworzona w inboxie zaczęła działać natychmiast dla wszystkich kolejnych syncow — bez wchodzenia w żaden osobny widok ustawień.
18. Jako owner chcę widzieć ostrzeżenie w inboxie „to wygląda na duplikat ręcznego wpisu X" jeśli apka znajdzie podobny wpis tego samego dnia o podobnej kwocie, żebym nie miał podwójnych wpisów po podpięciu banku.
19. Jako owner chcę kliknąć „to jest duplikat" przy takiej propozycji, żeby ją pominąć i zostawić oryginalny ręczny wpis.

### Edycja i widoczność bankowych wpisów

20. Jako owner po zatwierdzeniu wpisu z inboxu chcę widzieć go w normalnej liście przychodów/wydatków z badge `🏦 z banku`, żeby odróżnić od ręcznych.
21. Jako owner chcę móc zmienić kategorię i nazwę wpisu z banku, ale NIE chcę móc zmienić kwoty ani daty (bank to source of truth dla tych pól).
22. Jako member chcę widzieć wpisy podpięte z banku owner-a (oznaczone badge), ale NIE chcę móc ich edytować ani usuwać (są „owner-a" → reguła permissions już to ogarnia przez `created_by`).

### Re-authorization (90d cycle PSD2)

23. Jako owner na 7 dni przed wygaśnięciem zgody PSD2 dla banku chcę dostać email „Twoja zgoda dla PKO wygasa za 7 dni, odnów żeby sync nie stanął".
24. Jako owner na 1 dzień przed wygaśnięciem chcę dostać drugi email (last warning).
25. Jako owner chcę widzieć w apce żółty banner „Twoja zgoda dla PKO wygasa za X dni — odnów" gdy do wygaśnięcia <=7 dni.
26. Jako owner chcę widzieć czerwony banner „Sync z PKO zatrzymany — odnów zgodę" po wygaśnięciu.
27. Jako owner po kliknięciu „Odnów" chcę zostać przeprowadzonym przez ten sam flow co przy pierwszym podpięciu (bank login → wybór kont), żeby reaktywować sync.

### Historia i undo (integracja z `action_log`)

28. Jako owner chcę widzieć w historii zmian jeden wpis per sync „Sync z PKO: zaimportowano 12 transakcji" zamiast spamu 12 osobnych wpisów.
29. Jako owner chcę móc cofnąć cały batch importu w okienku 24h (jak ręczne wpisy) — undo usuwa wszystkie wpisy z tego synca.

### Limity i ops (Twoja strona jako admin apki)

30. Jako admin apki (Piotr) chcę widzieć banner w UI „Konto GC: 45/50 end-userów" gdy liczba aktywnych requisitions zbliża się do limitu free tier.
31. Jako admin chcę żeby przy 50/50 nowi owner-zy dostawali błąd „Limit osiągnięty — skontaktuj się z administratorem", a nie cichy upgrade na płatny plan.
32. Jako admin chcę endpoint `/api/admin/gc-usage` widoczny tylko dla mnie (whitelist email), pokazujący X/50 + lista najwcześniej wygasających requisitions.

## Implementation Decisions

### Architektura ogólna

- **Provider**: GoCardless Bank Account Data API (dawniej Nordigen). Free tier: 50 end-users, 90 dni historii.
- **Model konta GoCardless**: **single shared account** — admin apki (Piotr) trzyma swoje klucze GC w Cloudflare Workers secrets (`GOCARDLESS_SECRET_ID`, `GOCARDLESS_SECRET_KEY`). Wszystkie gospodarstwa dzielą jedno konto GC. Izolacja między gospodarstwami jest na poziomie naszej DB (per `household_id`), GC widzi tylko niezależne requisitions.
- **Trade-off przyjęty**: limit 50 end-userów jest wspólny → przy ~10-15 gospodarstwach × 1-2 banki nie zbliżamy się do limitu. Powyżej trzeba albo zapłacić (20 EUR/mies), albo wprowadzić hard-block (przyjęte: hard-block, decyzja admina).

### Permissions

- Tylko **owner** gospodarstwa może: podpinać/odłączać banki, definiować reguły, zatwierdzać wpisy z inboxa, widzieć ustawienia bank-sync.
- **Member** widzi w historii i listach badge `🏦 z banku` przy wpisach bankowych, ale nie ma żadnego UI do zarządzania syncem. Edytowalność takich wpisów już ogarnięta przez istniejący guard `assertCanMutateResource` (member nie może mutować `created_by != self`, a bank-wpisy mają `created_by = owner.id`).

### Flow podpinania banku

1. Owner klika „Połącz bank" → apka woła GC `GET /institutions?country=PL` → renderuje grid kafelków banków z logami.
2. Po wyborze banku → `POST /requisitions { institution_id, redirect_url, agreement }` → GC zwraca `link` (hosted page banku).
3. Owner zostaje przekierowany na `link`, loguje się do swojego banku, wyraża zgodę PSD2.
4. Po sukcesie bank/GC robi redirect z powrotem na nasz endpoint `GET /api/bank/callback?ref=...`.
5. Apka woła `GET /requisitions/{id}` → dostaje listę kont (`accounts`), pyta szczegóły (`GET /accounts/{id}/details` dla IBAN/nazwy).
6. Frontend pokazuje checkboxy „wybierz konta do sync" → owner zatwierdza.
7. Zapis w DB: `bank_connections` (1 row) + `bank_accounts` (N rows, tylko zaznaczone).

### Sync engine

- Cloudflare Cron Trigger co 4h iteruje `bank_connections WHERE status='active' AND next_sync_at <= NOW()`.
- Per connection: per enabled `bank_account` → `GET /accounts/{id}/transactions?date_from=...` (od `last_synced_at`).
- Filtrowanie po polach z GC: pomijaj transakcje z `bankTransactionCode` typu transferów wewnętrznych i wypłat bankomatowych (heurystyka — dopracujemy listę kodów na podstawie real responsem z PKO/ING).
- Mapowanie: `amount > 0` → kind=`income`, `< 0` → kind=`expense`, kwota brana jako `abs()`.
- Deduplikacja vs ręczne wpisy: dla każdej transakcji szukaj w `transactions` (manualnych) z `txn_date = booking_date` i `ABS(amount - manual.amount) < 0.01` → jeśli znaleziono, flag `duplicate_of_id` w inbox row.
- Po `applyRules(rules, txn)` zapisz `suggested_category` (może być NULL jeśli nic nie pasuje).
- Bulk-log w `action_log`: **jeden** wpis typu `CREATE` z `resource_type='bank_import'`, `after = { count: N, connection_id, account_ids }`. Undo usuwa wszystkie inbox rows + zatwierdzone transactions z tego batcha (w 24h oknie).

### Inbox

- Endpoint `GET /api/inbox?status=pending` zwraca listę propozycji do przeglądu.
- `POST /api/inbox/:id/approve { category?, rememberRule? }` → tworzy `transaction` z `source='bank'`, `created_by=owner.id`, `bank_inbox_id=inbox.id`. Jeśli `rememberRule=true` → upsert do `categorization_rules`.
- `POST /api/inbox/:id/dismiss` → status=`dismissed`, nic nie ląduje w budżecie.
- Inbox items są kept ze statusem `approved`/`dismissed` przez 30 dni dla audit/możliwości „przywrócić", potem cleanup cron.

### Re-authorization (90d)

- Codzienny cron sprawdza `bank_connections WHERE expires_at - NOW() <= 7 days AND last_warned_at IS NULL OR < 6 days ago`.
- Wysyłka maila przez Resend (template PL).
- UI: `RenewConsentBanner` w dashboardzie pokazuje stan banku.

### Limity ops

- Endpoint `/api/admin/gc-usage` woła `GET /requisitions/?status=LN` (linked) i liczy. Whitelist email z env `ADMIN_EMAILS`.
- `POST /api/bank/connect` najpierw sprawdza `count(active requisitions) >= 50` → zwraca 503 `{ error: 'gc_limit_reached' }`.

### Encryption

- `transaction_inbox.description`, `transaction_inbox.amount` szyfrowane tym samym `FINANCE_DATA_KEY` (AES-GCM) co `transactions.name`/`amount`.
- `bank_connections.requisition_id` — plaintext (sam ID, GC i tak je trzyma).
- `categorization_rules.pattern` — plaintext (nie jest sensytywne, choć można pomyśleć o szyfrowaniu w przyszłości).

### Model danych (4 nowe tabele + 2 kolumny)

- `bank_connections` (id, household_id, created_by, provider='gocardless', institution_id, institution_name, institution_logo_url, requisition_id, status, expires_at, last_synced_at, next_sync_at, last_warned_at, timestamps)
- `bank_accounts` (id, bank_connection_id, gc_account_id, iban_suffix, display_name, enabled, created_at)
- `transaction_inbox` (id, household_id, bank_connection_id, bank_account_id, gc_transaction_id UNIQUE, amount_enc, description_enc, booking_date, suggested_category, duplicate_of_id, status, decided_at, created_at)
- `categorization_rules` (id, household_id, pattern, category, created_by, hit_count, timestamps)
- `ALTER transactions ADD source TEXT DEFAULT 'manual'` ('manual' | 'bank')
- `ALTER transactions ADD bank_inbox_id UUID NULL`

### Dokumentacja

- **README.md**: nowa sekcja „Sync z bankiem (opcjonalne)" — wyjaśnienie dla owner-ów: kliknij „Połącz bank" → wybierz swój bank → zaloguj się na hosted page banku → wybierz konta → gotowe. Bez słowa o GC od strony usera, tylko od strony admin-setup.
- **README „Setup admina"**: jak dodać klucze GC do Workers secrets, gdzie zarejestrować się u GC, limity free tier.
- **Polityka prywatności**: dopisać GoCardless Ltd. jako data processor dla danych bankowych. Wymienić jakie dane są transmitowane (IBAN, transakcje), retention, podstawę prawną.

## Validation Strategy

### Per user story

| Stories | Jak weryfikować |
|---|---|
| 1-7 (podpinanie) | E2E test: stub GC, klikaj przez UI od „Połącz bank" do zatwierdzenia kont. Manualne testy z REAL PKO i ING (Twoje konta). |
| 8-12 (sync) | Integration test sync-engine z mock GC: insert sample transactions including transfers/ATM, oczekuj że tylko expense/income lądują w inbox, transfers skipped. |
| 13-19 (inbox) | E2E: stub generuje inbox items, klikaj Zatwierdź/Pomiń/duplicate, sprawdź state DB. Test deduplikacji: insert manual + odpal sync z tą samą kwotą → flag w inboxie. |
| 20-22 (badge + edycja) | UI test: render listy z mieszanymi `source='manual'/'bank'`, sprawdź obecność badge. PATCH na bank-row z `amount` w body → 400. |
| 23-27 (re-auth) | Test: insert connection z `expires_at = NOW + 7d`, odpal cron → sprawdź email log + status banneru. |
| 28-29 (action_log) | Sync → 1 wpis w action_log z `count=N`. Undo → wszystkie transactions z tego batcha zniknięte. |
| 30-32 (admin) | Test: insert 50 connection rows, GET /api/admin/gc-usage z email-em na whitelist zwraca 50/50. POST /api/bank/connect zwraca 503. Email NIE-admina dostaje 403. |

### Component „done" criteria

- **gocardless-client.js**: 100% endpointów które używamy ma test z mockowym fetch + happy path + error path (4xx, 5xx, timeout).
- **categorization-rules.js**: 10+ unit testów: matching case-insensitive, substring, brak match, konflikt reguł (priorytet = `hit_count` desc), edge cases (pusty pattern, NULL).
- **bank-sync-engine.js**: 5+ integration testów: pełny przebieg z 0/1/N transakcjami, dedupe, filter transferów, rollback przy błędzie GC.
- **inbox-service.js**: CRUD coverage + approve z `rememberRule=true` tworzy regułę + approve bez = nie tworzy + dismiss nie tknie budżetu.
- **bank-routes.js**: auth (401 bez tokena), permissions (403 dla member-a na owner-only endpoint), 503 dla limit_reached.
- **Frontend**: build ✓, manual smoke test pełnego flow.

### Quality thresholds

- Sync errors per 100 syncow: <1% (twardy fail po retry → email do admina).
- False-positive dedupe rate: <5% w realnych warunkach (manual testing 2 tyg).
- Time-to-categorize (od sync do zatwierdzenia w inboxie): średnia <2 dni dla aktywnych userów.

## Out of Scope

- **Multi-account linking dla savings_accounts** — decyzja: `savings_accounts` w apce zostają ręczne, NIE są linkowane z realnymi kontami oszczędnościowymi w banku. Przelew na konto oszczędności w banku pojawi się jako wydatek w inboxie i user go pominie (transfer wewnętrzny powinien być auto-skipped po typie, ale jak nie zadziała — manual dismiss).
- **Auto-recurring detection dla „stałych"** — pensja/Netflix nie są auto-flagowane jako `isFixed=true`. User sam zaznaczy przy zatwierdzaniu w inboxie albo później edytuje.
- **BYO GoCardless credentials** — odrzucone, używamy jednego konta admina. Jeśli kiedyś dolecimy do 50 → albo upgrade do paid, albo dorobimy BYO jako Phase 2.
- **Salt Edge / Kontomatik** — tylko GoCardless. Inne agregatory poza scope MVP.
- **Mobile push notifications** — sync notyfikacje tylko przez email (Resend) i banner w UI.
- **Eksport historycznych transakcji starszych niż 90 dni** — GC nie daje, nie próbujemy obejść.
- **CSV import jako fallback** — odrzucone na rzecz pełnego skupienia na API.

## Further Notes

### Phasing

Sensowny podział na vertical slices (kandydaci do `/carve`):

1. **Slice 1 — Setup admina + GC client**: secrets w Workers, `gocardless-client.js` z testami, endpoint `/api/admin/gc-usage` z whitelist.
2. **Slice 2 — Podpinanie banku**: tabele `bank_connections` + `bank_accounts`, endpointy `POST /connect`, `GET /callback`, `GET /connections`, `DELETE /connections/:id`. Frontend: `BankConnectFlow` (grid + callback) + `BankConnections` (lista). Bez sync — tylko podpięcie i odpięcie.
3. **Slice 3 — Sync engine + inbox (bez reguł)**: tabela `transaction_inbox`, cron, endpointy `/api/bank/sync` (manual) + `/api/inbox` + `/api/inbox/:id/approve|dismiss`. Frontend `Inbox`. Bez reguł, bez dedupe — wszystko ręcznie kategoryzowane.
4. **Slice 4 — Reguły + dedupe**: tabela `categorization_rules`, integracja `applyRules` w sync, dedupe vs manual. Inbox dostaje „zapamiętaj regułę".
5. **Slice 5 — Re-auth flow + bannery + emaile**: cron renewal, templates Resend, `RenewConsentBanner`.
6. **Slice 6 — Polish + dokumentacja**: badge `🏦`, edytowalność guard (no kwota/data), README, polityka prywatności, screenshots.

### Risks

1. **GC API zmiany / outage**: GC SLA jest free-tier OK ale bez gwarancji. Backup: retry + log + email admin.
2. **Polskie banki edge cases**: PKO/ING mają specyficzne formaty opisów (skróty), dedupe może być słaby na początku. Mitigation: 2 tyg dogfooding tylko na Twoich kontach przed udostępnieniem znajomym.
3. **PSD2 90d cycle UX**: user może przegapić email + banner i sync stoi 2 mies → kiedy w końcu wejdzie, traci dane z >90d (GC nie daje historii wstecz po reauth — confirm w docs!). Mitigation: bardzo widoczny czerwony banner + email.
4. **Limit 50 end-users**: ~12 osób × 2 banki = 24 requisitions. Bezpieczne. Ale 1 osoba może podpiąć 3-4 banki → 12 osób × 4 = 48. Cienko. Soft warning od 45.
5. **RODO/data processor liability**: jako single-GC-account jesteś prawnym data processor. Trzeba: zaktualizować politykę prywatności, dodać zgodę przy podpinaniu banku, w razie kontroli mieć DPA z GC. Akceptujesz ryzyko świadomie.

### Decyzje świadomie odrzucone

- BYO credentials (rozważone, odrzucone na rzecz prostoty UX)
- Multi-step wizard z FAQ (odrzucone na rzecz minimum tarcia)
- Pełne 90 dni przy pierwszym imporcie (odrzucone — tylko bieżący miesiąc)
- Auto-import bez inboxa (odrzucone — user musi mieć kontrolę)
- Webhook od GC (odrzucone — cron prostszy, GC nie ma niezawodnych webhooków na free tier)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
