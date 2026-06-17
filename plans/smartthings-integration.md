# Plan: Urządzenia SmartThings (Samsung i inne)

> Source PRD: [issue #37](https://github.com/PiotrSobiecki/HomeCashflow/issues/37) · `plans/smartthings-prd.md`
> Kontekst: rozszerza integrację **Tuya** (issue #21, `plans/smart-devices-tuya.md`).
> **SmartThings ≠ Tuya** — pralki/suszarki Samsung, lodówki, klima, TV żyją w ekosystemie
> Samsung SmartThings i wymagają **osobnego OAuth API**.
> Docs: [SmartThings API](https://developer.smartthings.com/docs/api/public) · [OAuth Integrations](https://developer.smartthings.com/docs/connected-services/oauth-integrations)

## Cel produktu

Wspólny **domowy dashboard**: w zakładce „Inteligentne urządzenia" sekcja SmartThings
obok Tuya. Owner łączy konto Samsung (OAuth), dodaje urządzenia (pralka, suszarka,
zmywarka, lodówka, klima, TV), domownicy widzą **status cyklu na żywo**, mogą
**sterować** (start/pauza/stop) i **powiązać pralkę z gniazdkiem Tuya** dla realnego
kosztu prądu.

**Poza zakresem MVP:** powiadomienia o końcu cyklu (backlog), automatyka ST
(Routines/Scenes), certyfikacja Marketplace, zastąpienie apki SmartThings,
webhooki/subskrypcje zdarzeń (Target URL).

---

## Architectural decisions

Decyzje trwałe, obowiązujące we wszystkich fazach:

- **Architecture style**: osobny moduł backendu `server/src/smartthings/` obok `tuya/`
  (wspólny UI kart, rozdzielona logika providerów). Tuya **bez zmian zachowania**.
- **Provider / API**: SmartThings REST API (`api.smartthings.com`), **OAuth 2.0
  Authorization Code** w produkcji. PAT tylko do spike/dev (wygasa po 24h od 30.12.2024).
- **Auth model**: jeden OAuth-In SmartApp HomeCashflow (Client ID/Secret w sekretach
  Workers). Tokeny **per gospodarstwo** (inaczej niż BYO-credentials w Tuya).
- **Setup dewelopera (raz) vs flow użytkownika (per user)**: cała ceremonia (CLI,
  `apps:create`, Client ID/Secret, PAT do spike) jest **jednorazowa po naszej stronie** —
  user jej nie widzi. Nowy user na froncie ma tylko: **klik „Połącz konto Samsung" →
  login Samsung + zgoda → wybór urządzeń** (jak „Zaloguj przez Google"; zero CLI/tokenów/
  kluczy). To wygodniejsze dla usera niż Tuya (gdzie user sam zakłada projekt i wkleja
  Client ID/Secret). Haczyk: ten łatwy flow dla **obcych** działa dopiero po certyfikacji
  Samsunga (patrz „Key constraint"); dla nas + bliskich od razu po `apps:create`.
- **Tokeny**: `access_token` (~24h) + `refresh_token`, szyfrowane AES-GCM (`FINANCE_DATA_KEY`).
  Refresh lazy przy 401 + cron co 12h. Obsługa rotacji refresh tokenu i `invalid_grant`
  (banner „Połącz ponownie"). Nigdy nie zwracane w odpowiedziach API.
- **Scopes**: `r:locations:*`, `r:devices:*`, `x:devices:*` (sterowanie).
- **Data model**: rozszerzenie `smart_devices` o `provider` (`tuya`|`smartthings`) +
  `external_device_id`; nowy `UNIQUE(provider, external_device_id)`; backfill istniejących
  Tuya. Snapshot capabilities w kolumnie JSONB. Nowa tabela `smartthings_credentials`
  (PK = `household_id`).
- **Key entities**: `smartthings_credentials`, `smart_devices` (rozszerzone),
  `device_command_log` (reuse), `linked_plug_id` (reuse self-FK dla powiązania z Tuya).
- **Capabilities**: deep module — czysta funkcja `(surowy status + profil) → (UI-model +
  dozwolone komendy)`. Wspierane typy: washer/dryer/dishwasher (pełny cykl) +
  fridge/AC/TV (podstawowy); fallback generyczny dla nietypowych.
- **Uprawnienia**: Owner — łączenie/rozłączanie, import, sterowanie, powiązania;
  Member — podgląd + dozwolone komendy; Guest — brak (localStorage).
- **Integrations**: Samsung SmartThings (OAuth, processor danych — RODO: usuwanie przy
  disconnect, ujawnienie scope'ów w polityce prywatności). Tuya (pomiar kWh dla kosztu).
- **Deploy**: Worker + Neon; redirect URI `https://api.homecashflow.org/api/smartthings/callback`
  (dev: localhost). Migracje: najpierw dev (Neon), potem prod — oba branche spójne.
- **Key constraint (warunek wejścia)**: audytorium publiczne + sterowanie (`x:devices`)
  → **publiczna dystrybucja wymaga review/certyfikacji Samsunga (~2–4 tyg.) + zgodności
  RODO**. Sam flow OAuth prawdopodobnie działa dla obcych kont przed certyfikacją
  (dokumentacja nie potwierdza twardej blokady) — **do potwierdzenia w Fazie 0**.

---

## Faza 0: Spike + test certyfikacji (pre-work)

**User stories**: — (warunek wejścia z PRD)

### What to build

Zdjęcie największej niewiadomej **zanim powstanie kod produkcyjny**. Rejestracja
OAuth-In SmartApp przez SmartThings CLI (`apps:create`, typ OAuth-In, scopes + redirect
URI), Client ID/Secret do sekretów. Spike skryptem na PAT: `GET /devices` i
`GET /devices/{id}/status` z prawdziwego konta. **Kluczowe: test E2E, czy drugie konto
Samsung autoryzuje niecertyfikowaną aplikację** (rozstrzyga harmonogram publicznego
wydania).

### Acceptance criteria

- [ ] OAuth-In SmartApp zarejestrowany, Client ID/Secret w `.dev.vars` / Wrangler
- [ ] Pralka/suszarka dodana w apce SmartThings na telefonie, widoczna przez spike
- [ ] Spike (PAT) listuje urządzenia i ich status z realnego konta
- [ ] Rozstrzygnięte: czy obce konto Samsung autoryzuje aplikację bez certyfikacji
- [ ] Oszacowany czas review i czy `x:devices` go zaostrza

---

## Faza 1: Połączenie konta (OAuth + status)

**User stories**: 1, 2, 3, 4, 5, 6, 27

### What to build

End-to-end: Owner w zakładce urządzeń klika „Połącz konto Samsung" → redirect na OAuth
Samsung → callback wymienia code na tokeny → szyfrowane zapisanie w
`smartthings_credentials` → UI pokazuje status „Połączono". Rozłączenie kasuje
credentials. Refresh tokenu lazy przy 401 + cron co 12h; przy `invalid_grant` banner
„Połącz ponownie". Connect/disconnect tylko dla Ownera.

### Acceptance criteria

- [ ] Owner: Połącz → login Samsung → callback → status „Połączono"
- [ ] Tokeny zaszyfrowane, nigdy w odpowiedzi API
- [ ] Member: 403 na connect/disconnect
- [ ] Symulacja 401 → automatyczny refresh; `invalid_grant` → banner „Połącz ponownie"
- [ ] Rozłączenie usuwa credentials

---

## Faza 2: Import urządzenia → karta

**User stories**: 7, 8, 9, 10, 11, 16, 28

### What to build

Migracja `smart_devices` (`provider`, `external_device_id`, nowy unique, backfill Tuya).
Discover listuje urządzenia z konta ST (już dodane odfiltrowane), Owner dodaje jednym
kliknięciem (opcjonalna nazwa) → pobranie profilu + snapshot capabilities → karta w
siatce z badge SmartThings. Usuwanie dotyczy tylko wpisów `provider=smartthings`.
Rozłączenie konta (Faza 1) kasuje też urządzenia ST.

### Acceptance criteria

- [ ] Discover zwraca pralkę/suszarkę z konta ownera, dodane odfiltrowane
- [ ] Dodanie → karta z `provider=smartthings` + zapisany snapshot capabilities
- [ ] Duplikat `external_device_id` (inne gospodarstwo) → 409
- [ ] Rozłączenie ST kasuje credentials i urządzenia ST
- [ ] Urządzenia Tuya bez regresji (test regresji)

---

## Faza 3: Status na żywo

**User stories**: 12, 13, 14, 15, 17

### What to build

Deep module `capabilities`: czysta funkcja mapująca surowy status ST + profil na
jednolity UI-model (washer/dryer/dishwasher: bezczynna/w trakcie/pauza/gotowe +
szacowany koniec; fridge/AC/TV: podstawowy on/off/tryb; fallback dla nietypowych) oraz
listę dozwolonych komend. Karty pokazują czytelny stan (nie surowy JSON), badge offline,
polling ~30 s na otwartej zakładce (reuse mechanizmu z Tuya). Rozróżnienie kart ST vs Tuya.

### Acceptance criteria

- [ ] Pralka w trakcie → „W trakcie" + szacowany koniec (jeśli ST zwraca)
- [ ] Po cyklu → „Gotowe/idle"; offline → badge „Brak połączenia"
- [ ] Lodówka/klima/TV → podstawowy sensowny stan; nieznane capability → fallback bez błędu
- [ ] Status odświeża się automatycznie bez przeładowania
- [ ] Mapper pokryty testami na fixture'ach (washer/dryer/dishwasher/fridge/AC/TV)

---

## Faza 4: Sterowanie

**User stories**: 18, 19, 20, 21, 22, 23

### What to build

Komendy start/pauza/stop tam, gdzie pozwala capability. UI renderuje **tylko** przyciski
faktycznie wspieranych komend (z zapisanego snapshotu). Walidacja komendy względem
capabilities **przed** wysłaniem do ST (spoza zakresu → 400). Log każdej komendy do
`device_command_log` (kto/kiedy/co). Komunikaty PL przy błędach ST (zajęte / brak
capability / offline). Member może dozwoloną komendę, Guest 403.

> **Odkrycie ze spike (#38, realna pralka Samsung):** capability `remoteControlStatus`
> zwraca `remoteControlEnabled = "false"` domyślnie — Samsung **odrzuca komendy** dopóki
> user fizycznie nie włączy „zdalnego sterowania" na pralce. UI musi czytać tę flagę:
> gdy `false` → przyciski zablokowane + komunikat „Włącz zdalne sterowanie na pralce".

### Acceptance criteria

- [ ] Gdy `remoteControlEnabled=false` → przyciski zablokowane + komunikat PL (nie wysyłamy komendy)
- [ ] Start/pauza/stop działa na prawdziwym urządzeniu po włączeniu zdalnego sterowania (manual E2E)
- [ ] Komenda spoza capabilities → 400 przed wysłaniem do ST
- [ ] Member wysyła dozwoloną komendę; Guest 403
- [ ] Wpis w `device_command_log` (kto, kiedy, co)
- [ ] Czytelny komunikat PL przy błędzie ST

---

## Faza 5: Koszt — powiązanie z gniazdkiem Tuya

**User stories**: 24, 25, 26

> **Odkrycie ze spike (#38):** pralka Samsung **sama** wystawia `powerConsumptionReport`
> (`energy` skumulowane w Wh, `power` w W) oraz `samsungce.waterConsumptionReport`. Czyli
> dla urządzeń ST z tą capability **koszt można czytać wprost z SmartThings** — link do
> gniazdka Tuya jest wtedy **redundantny**. Decyzja do podjęcia: czy Faza 5 to nadal
> głównie link do Tuya (dla urządzeń bez pomiaru), czy raczej „użyj `powerConsumptionReport`
> gdy jest, a gniazdko Tuya tylko jako fallback". Rekomendacja: **najpierw natywny pomiar ST,
> link Tuya jako opcja** — mniej konfiguracji dla usera.

### What to build

Pomiar energii pralki z dwóch możliwych źródeł, w kolejności:
1. **Natywny `powerConsumptionReport` z SmartThings** (gdy urządzenie go wystawia) —
   moc bieżąca + energia; bez żadnej konfiguracji usera.
2. **Fallback: powiązanie z gniazdkiem Tuya** — reuse `linked_plug_id` (self-FK w
   `smart_devices`) rozszerzony na `provider=smartthings`; dla urządzeń ST bez pomiaru
   własnego. Owner wiąże pralkę z gniazdkiem, odpięcie czyści powiązanie.

Karta pralki pokazuje moc + kWh (ze źródła, które jest dostępne).

### Acceptance criteria

- [ ] Owner wiąże pralkę ST z gniazdkiem Tuya; może odpiąć
- [ ] Karta pralki pokazuje cykl ST + moc i kWh dziś z gniazdka
- [ ] Brak powiązania → karta bez sekcji poboru (bez błędu)

---

## Kolejność (tracer bullets)

| Krok | Faza | Deliverable | Demo |
|------|------|-------------|------|
| 0 | Spike + test cert. | OAuth-In SmartApp, spike PAT, test obcego konta | lista urządzeń z realnego konta |
| 1 | Połączenie | OAuth connect/disconnect, status, refresh | „Połączono", tokeny w DB |
| 2 | Import | migracja, discover, dodanie urządzenia | pralka jako karta |
| 3 | Status | mapper capabilities, polling | „W trakcie" + koniec cyklu |
| 4 | Sterowanie | komendy + walidacja + log | start/stop na pralce |
| 5 | Koszt (Tuya) | powiązanie z gniazdkiem | cykl ST + pobór mocy |

Każda faza = osobny PR. Tuya pozostaje bez zmian zachowania.
Powiadomienia o końcu cyklu — backlog (wymaga crona globalnego per gospodarstwo).
