# PRD: Inteligentne urządzenia — SmartThings (Samsung i inne)

> Plan implementacji (fazy): `plans/smartthings-integration.md`
> Kontekst: rozszerza istniejącą integrację Tuya (issue #21, `plans/smart-devices-tuya.md`)
> Spike do zrobienia: `server/scripts/smartthings-spike.mjs`

## ⚠️ Warunek wejścia (przed dystrybucją publiczną)

Audytorium jest **publiczne** (obcy zakładają konta), a my chcemy **sterowanie** (`x:devices`).

Ustalenia z dokumentacji SmartThings (research, czerwiec 2026):

- **PAT = tylko dev.** Od 30 grudnia 2024 nowe Personal Access Tokeny wygasają po **24h**;
  Samsung wymaga OAuth authorization_code do ciągłego dostępu. → założenie planu poprawne.
- **Publiczna dystrybucja third-party wymaga certyfikacji/review (~2–4 tygodnie)** wg
  Product Policies + zgodność z lokalnym prawem prywatności (istotne dla RODO).
- **Niuans (skorygowane):** dokumentacja **nie** potwierdza twardej blokady logowania
  obcych kont do niecertyfikowanego OAuth-In SmartApp ani limitu test-userów. Realnie sam
  flow OAuth zwykle działa dla innych kont (ekran zgody), a certyfikacja „Works With
  SmartThings" dotyczy raczej oficjalnego listingu/brandingu i zgodności niż technicznej
  blokady. **Do twardego potwierdzenia własnym testem (drugie konto Samsung) lub przez
  support** — zanim obiecamy publiczne wydanie.

**Do potwierdzenia przed dystrybucją publiczną:**
- Czy drugie konto Samsung autoryzuje naszą niecertyfikowaną aplikację (test E2E).
- Ile realnie trwa review i czy `x:devices:*` (sterowanie) zaostrza proces vs `r:devices`.
- Czy remote-start AGD nie jest blokowany po stronie Samsunga (bezpieczeństwo).

To odróżnia SmartThings od Tuya, gdzie każdy user wnosi **własny** projekt (BYO
credentials) i omija temat certyfikacji.

---

## Problem Statement

Jako użytkownik HomeCashflow mam w domu nie tylko gniazdka Tuya, ale też sprzęt
Samsung/SmartThings — pralkę, suszarkę, zmywarkę, lodówkę, klimatyzację, telewizor.
Te urządzenia żyją w osobnym ekosystemie (SmartThings), więc żeby sprawdzić czy
pranie się skończyło, włączyć/zatrzymać cykl albo zobaczyć ile prądu zżarła pralka,
muszę otwierać kolejną aplikację. Chcę **jeden domowy dashboard** — Tuya i Samsung
obok siebie — w miejscu, w które i tak codziennie zaglądam, oraz powiązać pralkę
SmartThings z gniazdkiem Tuya, żeby widzieć realny koszt prądu cyklu.

Każde gospodarstwo łączy **swoje** konto Samsung — nie ma jednego wspólnego konta.

## Solution

W istniejącej zakładce **„Inteligentne urządzenia"** pojawia się sekcja **SmartThings**
obok Tuya. Owner klika **„Połącz konto Samsung"** → logowanie Samsung (OAuth) → apka
szyfruje i trzyma tokeny per gospodarstwo. Owner wybiera urządzenia z listy konta
(pralka, suszarka, zmywarka, lodówka, klima, TV) i dodaje je jako karty. Każdy domownik
widzi **status na żywo** (stan cyklu, szacowany koniec, online/offline), Owner i Member
**sterują** urządzeniem w zakresie, na jaki pozwala dane urządzenie (start/pauza/stop),
a pralkę można **powiązać z gniazdkiem Tuya**, żeby na karcie widzieć pobór mocy i koszt.

### Setup dewelopera (raz) vs flow użytkownika (per user)

Kluczowe rozróżnienie — cała „ceremonia" jest jednorazowa po naszej stronie, **user jej
nie widzi**:

| | **My (deweloper/ops), RAZ dla całej apki** | **Każdy nowy user, na froncie** |
|--|--------------------------------------------|----------------------------------|
| Co robi | CLI SmartThings, `apps:create` (OAuth-In SmartApp), zapis Client ID/Secret w sekretach Workers, (opcjonalnie) PAT do spike | 1. Klik **„Połącz konto Samsung"** → 2. login Samsung + zgoda → 3. wybór urządzeń |
| Częstotliwość | Raz (+ ewentualny re-deploy) | Za każdym razem gdy ktoś dołącza |
| Trudność | Techniczna (jednorazowa) | Trywialna — jak „Zaloguj przez Google" |
| CLI / tokeny / klucze | Tak (nasza strona) | **Nie — zero** |

To **wygodniejsze dla usera niż Tuya**: w Tuya każdy user zakłada własny projekt Tuya IoT
i wkleja Client ID/Secret/Device ID (technicznie trudne). W SmartThings my rejestrujemy
jeden OAuth-In SmartApp, a user tylko klika zgodę.

**Haczyk:** ten łatwy flow dla **obcych** userów działa dopiero **po certyfikacji
Samsunga** (patrz „⚠️ Warunek wejścia"). Dla nas + bliskich działa od razu po
`apps:create`; dla publiczności — po review (~2–4 tyg.). To weryfikuje test drugim
kontem Samsung w Fazie 0.

---

## User Stories

### Połączenie konta (Owner)
1. Jako Owner chcę kliknąć „Połącz konto Samsung" i przejść logowanie OAuth, aby powiązać moje konto SmartThings z gospodarstwem bez ręcznego wpisywania kluczy.
2. Jako Owner chcę widzieć status „Połączono / Połącz konto", aby wiedzieć czy integracja jest aktywna.
3. Jako Owner chcę móc rozłączyć konto SmartThings, aby cofnąć dostęp; rozłączenie usuwa moje tokeny i urządzenia SmartThings z gospodarstwa.
4. Jako Owner chcę, aby tokeny były szyfrowane i nigdy nie pojawiały się w odpowiedziach API, aby moje konto było bezpieczne.
5. Jako Owner chcę, aby apka sama odświeżała wygasły token (refresh), abym nie był ciągle rozłączany.
6. Jako Owner chcę zobaczyć czytelny banner „Połącz ponownie", gdy refresh się nie powiedzie (`invalid_grant`), abym wiedział że trzeba ponowić autoryzację.

### Import urządzeń (Owner)
7. Jako Owner chcę zobaczyć listę urządzeń z mojego konta SmartThings, aby wybrać które dodać.
8. Jako Owner chcę, aby urządzenia już dodane były odfiltrowane z listy, aby nie dublować.
9. Jako Owner chcę dodać urządzenie jednym kliknięciem (z opcjonalną własną nazwą), aby pojawiło się jako karta.
10. Jako Owner chcę, aby przy dodaniu zapisał się snapshot możliwości urządzenia (capabilities), aby UI wiedziało jakie kontrolki pokazać.
11. Jako Owner chcę usunąć dodane urządzenie SmartThings, aby zarządzać siatką kart.

### Status na żywo (wszyscy domownicy)
12. Jako Member chcę widzieć stan pralki/suszarki/zmywarki (bezczynna / w trakcie / pauza / gotowe), aby wiedzieć kiedy odebrać pranie.
13. Jako Member chcę widzieć szacowany czas zakończenia cyklu, jeśli urządzenie go zwraca, aby zaplanować dzień.
14. Jako Member chcę widzieć podstawowy stan lodówki/klimy/TV (np. on/off, tryb), aby mieć podgląd całego domu.
15. Jako Member chcę widzieć badge „Brak połączenia", gdy urządzenie jest offline, aby nie mylić tego z błędem.
16. Jako Member chcę rozróżnić karty SmartThings od Tuya po badge'u, aby wiedzieć z jakiego ekosystemu jest urządzenie.
17. Jako użytkownik chcę, aby status odświeżał się automatycznie na otwartej zakładce (polling ~30 s), aby dane były aktualne bez przeładowania.

### Sterowanie (Owner + Member)
18. Jako Member chcę uruchomić/zatrzymać/zapauzować urządzenie, gdy pozwala na to jego capability, aby sterować nim bez apki Samsung.
19. Jako użytkownik chcę widzieć tylko przyciski komend faktycznie wspieranych przez dane urządzenie, aby nie klikać niedziałających akcji.
20. Jako użytkownik chcę, aby komenda spoza możliwości urządzenia była odrzucona zanim trafi do SmartThings, aby uniknąć błędów i nadużyć.
21. Jako użytkownik chcę czytelny komunikat po polsku przy błędzie (urządzenie zajęte / brak capability / offline), aby rozumieć co się stało.
22. Jako Owner chcę, aby każda wysłana komenda była zapisana w historii urządzeń (kto, kiedy, co), aby był ślad audytowy.
23. Jako Guest nie mam dostępu do sterowania ani połączenia (tylko localStorage), zgodnie z modelem uprawnień aplikacji.

### Koszt energii — powiązanie z Tuya (MVP)
24. Jako Owner chcę powiązać pralkę SmartThings z gniazdkiem Tuya mierzącym pobór, aby zobaczyć realne zużycie prądu cyklu.
25. Jako Member chcę widzieć na karcie pralki aktualną moc i kWh dziś z powiązanego gniazdka, aby ocenić koszt prania.
26. Jako Owner chcę móc odpiąć powiązanie z gniazdkiem, aby zmienić konfigurację.

### Uprawnienia
27. Jako Member chcę dostać 403 przy próbie połączenia/rozłączenia/importu, bo to akcje tylko dla Ownera.
28. Jako Owner chcę, aby istniejące urządzenia Tuya działały bez zmian po wdrożeniu SmartThings (zero regresji).

## Implementation Decisions

- **Provider:** SmartThings REST API (`api.smartthings.com`), OAuth 2.0 Authorization Code w produkcji. PAT tylko do spike/dev.
- **Model auth:** jeden OAuth-In SmartApp HomeCashflow (Client ID/Secret w sekretach Workers). Tokeny **per gospodarstwo** (inaczej niż BYO-credentials w Tuya).
- **Tokeny:** `access_token` (~24 h) + `refresh_token`, szyfrowane AES-GCM tym samym kluczem co dane finansowe; refresh przy 401 (lazy) i cron co 12 h. Obsługa rotacji refresh tokenu i `invalid_grant`.
- **Scopes (start):** `r:locations:*`, `r:devices:*`, `x:devices:*` (sterowanie). Do doprecyzowania przy rejestracji/review.
- **Granica z Tuya:** wspólny UI kart, **osobne** moduły backendu (`smartthings/` vs `tuya/`). Tuya bez zmian zachowania.
- **Model danych:** rozszerzenie `smart_devices` o `provider` (`tuya`|`smartthings`) i `external_device_id`; nowy `UNIQUE(provider, external_device_id)`; backfill istniejących Tuya. Nowa tabela `smartthings_credentials` (per household). Snapshot capabilities w kolumnie JSONB.
- **Capabilities:** czytane dynamicznie z API; **moduł-mapper** (deep module, czysta funkcja) tłumaczy surowe capabilities → jednolity UI-model i listę dozwolonych komend. Wspierane typy: pralka/suszarka/zmywarka (pełny model cyklu) + lodówka/klima/TV (podstawowy on/off/tryb); fallback generyczny dla nietypowych.
- **Zakres urządzeń:** AGD (washer/dryer/dishwasher) + lodówka/klima/TV. Nie: pełna automatyka (Routines/Scenes).
- **Sterowanie:** w MVP (Phase 4). Walidacja komendy względem zapisanych capabilities **przed** wysłaniem do ST. Log do `device_command_log`. **Odkrycie ze spike #38:** capability `remoteControlStatus.remoteControlEnabled` bywa `"false"` — wtedy Samsung odrzuca komendy; UI musi zablokować przyciski + pokazać „Włącz zdalne sterowanie na pralce".
- **Koszt energii:** w MVP. **Odkrycie ze spike #38:** pralka Samsung sama wystawia `powerConsumptionReport` (energia/moc), więc dla urządzeń ST z tą capability koszt czytamy **wprost z SmartThings**; powiązanie z gniazdkiem Tuya (`linked_plug_id`, rozszerzone na `provider=smartthings`) to **fallback** dla urządzeń bez pomiaru własnego. Rekomendacja: najpierw natywny pomiar ST, link Tuya jako opcja.
- **Powiadomienia (cykl gotowy):** poza MVP (backlog) — wymagają crona pollującego status wszystkich gospodarstw.
- **Deploy:** Worker + Neon; redirect URI OAuth `https://api.homecashflow.org/api/smartthings/callback` (dev: localhost).
- **RODO:** publiczne audytorium → jesteśmy administratorem danych domowych userów (Samsung jako processor). Usuwanie danych przy disconnect, podstawa przetwarzania, ujawnienie scope'ów w polityce prywatności.

### Deep modules do niezależnej weryfikacji
- **`smartthings/capabilities`** — czysta funkcja `(surowy status + profil) → (UI-model + dozwolone komendy)`. Testy na fixture'ach prawdziwych urządzeń, zero I/O. **Najwyższy priorytet pokrycia.**
- **`smartthings/oauth`** — taniec OAuth, rotacja/refresh, szyfrowanie. Testy na mockach token endpointu.
- **`smartthings/client`** — HTTP, retry/backoff, normalizacja błędów. Testy na mockach `api.smartthings.com`.

## Validation Strategy

- **Połączenie:** Owner przechodzi pełny flow OAuth → status „Połączono"; Member dostaje 403 na connect/disconnect; tokeny nigdy w odpowiedzi API (test integracyjny sprawdza brak pól). Symulacja 401 → automatyczny refresh; symulacja `invalid_grant` → banner „Połącz ponownie".
- **Import:** discover zwraca prawdziwe urządzenia z konta; dodanie tworzy kartę z `provider=smartthings`; duplikat `external_device_id` → 409; rozłączenie kasuje credentials + urządzenia ST; urządzenia Tuya bez regresji (test regresji).
- **Capabilities (deep module):** zestaw fixture'ów (pralka w trakcie / gotowa / offline, suszarka, zmywarka, lodówka, klima, TV) → mapper zwraca poprawny UI-model i listę komend. 100% kluczowych gałęzi; nieznane capability → fallback bez wyjątku.
- **Status:** pralka w trakcie → „W trakcie" + szacowany koniec (jeśli ST zwraca); po cyklu → „Gotowe/idle"; offline → badge „Brak połączenia"; polling odświeża bez przeładowania.
- **Sterowanie:** start/pauza/stop na prawdziwym urządzeniu (manual E2E); komenda spoza capabilities → 400 przed wysłaniem; Member może dozwoloną, Guest 403; wpis w `device_command_log`.
- **Koszt:** urządzenie z `powerConsumptionReport` → moc/kWh wprost z ST; bez tej capability → Owner wiąże pralkę z gniazdkiem Tuya (fallback), karta pokazuje moc + kWh, odpięcie czyści powiązanie.
- **Done dla komponentu:** testy jednostkowe modułu zielone + acceptance criteria danej fazy w `plans/smartthings-integration.md` odhaczone + brak regresji Tuya.

## Out of Scope

- Pełna automatyka SmartThings (Routines/Scenes/sceny).
- Certyfikacja SmartThings Marketplace jako produktu (osobny proces, choć review OAuth jest warunkiem wejścia).
- Zastąpienie aplikacji SmartThings.
- Powiadomienia push/email o zakończeniu cyklu (backlog — wymaga crona globalnego).
- Pomiar kWh bezpośrednio z urządzenia ST (koszt liczymy z powiązanego gniazdka Tuya).
- Webhooki/subskrypcje zdarzeń ST (Target URL) — opcjonalne, poza MVP.

## Further Notes

- Sekwencja faz (tracer bullets) w `plans/smartthings-integration.md` wymaga **reorderu**: Faza 5 (link Tuya) wchodzi do MVP, więc nie może zostać w backlogu — koszt prądu jest jedynym finansowym hakiem integracji.
- Migracja `smart_devices` zweryfikowana względem realnego schematu: `tuya_device_id` jest dziś `NOT NULL UNIQUE`, `linked_plug_id` (self-FK) i `device_command_log` już istnieją i nadają się do reuse.
- Każda faza = osobny PR; najpierw migracja na dev (Neon), potem prod — oba branche spójne.
