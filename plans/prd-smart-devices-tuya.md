# PRD: Inteligentne urządzenia (Tuya Open API)

> GitHub issue: [#21](https://github.com/PiotrSobiecki/HomeCashflow/issues/21)
> Plan implementacji (fazy): `plans/smart-devices-tuya.md`
> Spike (działający): `kopalnie_krypto/crm/scripts/tuya-spike.mjs`

## Problem Statement

Jako użytkownik HomeCashflow mam w domu inteligentne gniazdka i urządzenia Tuya (np. Gosund), ale żeby je włączyć/wyłączyć albo sprawdzić ile prądu ciągną, muszę otwierać osobną aplikację Tuya/Smart Life. To rozprasza — jednej rzeczy (budżet domowy) pilnuję w HomeCashflow, a urządzeń w innej apce. Chcę widzieć i sterować swoimi urządzeniami w tym samym miejscu, w którym i tak codziennie zaglądam, oraz widzieć jak zużycie energii zmienia się w czasie (czy zostawiona grzałka faktycznie żre prąd, czy tydzień był droższy od poprzedniego).

Każde gospodarstwo ma swoje własne konto Tuya i swoje urządzenia — nie ma jednego wspólnego konta dla wszystkich.

## Solution

Nowa zakładka **„Inteligentne urządzenia"** w HomeCashflow. Owner gospodarstwa raz wpisuje w panelu apki swoje **własne** poświadczenia Tuya (Client ID, Client Secret, Device ID, region) — apka je szyfruje i od tego momentu, w imieniu tego gospodarstwa, rozmawia z chmurą Tuya. Owner dodaje urządzenia po Device ID (albo wybiera z listy powiązanego konta). Na zakładce każdy domownik widzi karty urządzeń ze statusem na żywo (online, wł./wył., moc, napięcie, zużycie) i **steruje nimi** — wł./wył. oraz **pełny zakres możliwości danego urządzenia** (jasność, kolor, timer, blokada itd.), generowany dynamicznie z tego, co Tuya wystawia dla danego modelu. Aplikacja zbiera pomiary w tle i rysuje **wykresy zużycia w zakresach 7 dni / 30 dni / 90 dni / 1 rok**.

Apka nie wychodzi poza sam akt sterowania: nie ma scenariuszy automatyki, harmonogramów reguł ani integracji z obcymi ekosystemami. Nie ma też żadnego powiązania z budżetem domowym — to samodzielny moduł monitoringu i sterowania.

## User Stories

### Konfiguracja poświadczeń Tuya (owner)

1. Jako owner chcę wpisać w ustawieniach gospodarstwa swój własny Client ID, Client Secret, Device ID i region (datacenter) Tuya, żeby podłączyć moje konto Tuya do apki.
2. Jako owner chcę, żeby apka od razu po zapisaniu zweryfikowała poświadczenia (pobrała token), żebym wiedział czy dane są poprawne, a nie dopiero przy pierwszym urządzeniu.
3. Jako owner przy błędnych danych chcę dostać czytelny komunikat (np. „sprawdź region projektu" / „zły Client ID lub Secret"), żeby wiedzieć co poprawić.
4. Jako owner chcę widzieć status integracji „Połączono ✓ / Niepołączono", żeby wiedzieć czy moduł jest gotowy.
5. Jako owner chcę, żeby mój Client Secret nigdy nie był pokazywany z powrotem w UI ani zwracany do przeglądarki, żeby był bezpieczny.
6. Jako owner chcę móc usunąć poświadczenia (rozłączyć Tuya), co kasuje też przypisane urządzenia, żeby wyczyścić integrację.
7. Jako member NIE chcę widzieć formularza poświadczeń ani móc go edytować — to wyłącznie sprawa ownera.
8. Jako owner chcę mieć w panelu instrukcję krok-po-kroku (dodaj urządzenia w apce Tuya → powiąż konto z projektem deweloperskim → wpisz dane tutaj), żeby skonfigurować integrację bez szukania w dokumentacji Tuya.

### Dodawanie i zarządzanie urządzeniami (owner)

9. Jako owner chcę dodać urządzenie wpisując jego Device ID z panelu Tuya, żeby pojawiło się w gospodarstwie.
10. Jako owner chcę móc wybrać urządzenie z listy powiązanego konta (discover), żeby nie przepisywać ręcznie ID.
11. Jako owner przy próbie dodania ID, którego nie ma na moim koncie Tuya, chcę dostać błąd „nie znaleziono urządzenia", żebym nie zapisał śmiecia.
12. Jako owner przy próbie dodania urządzenia już przypisanego do innego gospodarstwa chcę dostać błąd, żeby nie było konfliktu właścicielstwa.
13. Jako owner chcę zmienić wyświetlaną nazwę urządzenia (np. „Salon — lampa"), żeby łatwiej je rozpoznać niż po ID.
14. Jako owner chcę oznaczyć urządzenie jako nieaktywne / usunąć je z gospodarstwa (bez kasowania w chmurze Tuya), żeby przestało się odświeżać i zbierać dane.
15. Jako member NIE chcę widzieć przycisków dodawania/usuwania urządzeń — tylko owner nimi zarządza.

### Podgląd statusu na żywo (każdy domownik)

16. Jako domownik (owner lub member) chcę widzieć siatkę kart urządzeń ze statusem online/offline, żeby wiedzieć co jest podłączone.
17. Jako domownik chcę widzieć dla gniazdka chwilową moc (W), napięcie (V) i skumulowane zużycie (kWh), żeby ocenić obciążenie.
18. Jako domownik chcę widzieć czas ostatniej aktualizacji statusu, żeby wiedzieć czy dane są świeże.
19. Jako domownik chcę, żeby status sam się odświeżał gdy patrzę na otwartą zakładkę, bez ręcznego klikania.
20. Jako domownik chcę móc ręcznie odświeżyć pojedyncze urządzenie, kiedy się spieszę.
21. Jako domownik gdy Tuya nie odpowiada chcę zobaczyć łagodny komunikat „Nie udało się odświeżyć" zamiast pustej/zepsutej karty.
22. Jako gość (niezalogowany) NIE chcę widzieć tej zakładki albo chcę dostać komunikat „zaloguj się, aby podpiąć urządzenia".

### Sterowanie urządzeniami (każdy domownik)

23. Jako domownik chcę włączyć/wyłączyć urządzenie jednym kliknięciem z karty, żeby nie otwierać apki Tuya.
24. Jako domownik chcę sterować pełnym zakresem możliwości urządzenia (jasność, temperatura barwowa, kolor, tryb pracy, timer/odliczanie, blokada rodzicielska itp.) — tym co dany model faktycznie wystawia — żeby mieć maksymalną kontrolę.
25. Jako domownik chcę, żeby kontrolki renderowały się automatycznie wg typu funkcji (przełącznik dla wł./wył., suwak dla wartości z zakresem, lista dla trybów), żeby UI pasował do każdego urządzenia bez ręcznej konfiguracji.
26. Jako domownik po wysłaniu polecenia chcę zobaczyć potwierdzenie (toast „Wysłano") i szybką aktualizację stanu na karcie, żeby wiedzieć że zadziałało.
27. Jako domownik przy nieudanej komendzie chcę dostać komunikat błędu, żeby wiedzieć że stan się nie zmienił.
28. Jako owner chcę, żeby każde polecenie było zapisane w historii zmian (kto, kiedy, co przełączył), żeby było wiadomo kto wyłączył np. bojler.
29. Jako gość NIE chcę móc wysłać żadnej komendy sterującej (403).

### Wykresy zużycia (każdy domownik)

30. Jako domownik chcę widzieć wykres zużycia/mocy urządzenia w czasie, żeby zobaczyć trend.
31. Jako domownik chcę przełączać zakres wykresu: 7 dni / 30 dni / 90 dni / 1 rok, żeby patrzeć na krótkie i długie trendy.
32. Jako domownik chcę widzieć nad wykresem podsumowanie: zużycie kWh w wybranym zakresie i szczyt mocy, żeby mieć liczby a nie tylko krzywą.
33. Jako domownik gdy urządzenie jest nowe i nie ma jeszcze danych chcę zobaczyć „za mało pomiarów dla tego okresu" zamiast pustego wykresu.
34. Jako domownik chcę, żeby długie zakresy (90 dni, 1 rok) ładowały się szybko (zagregowane), a nie zwieszały apkę tysiącami punktów.

### Tło i ops

35. Jako system chcę w tle (cron co 15 min) zapisywać pomiar każdego aktywnego urządzenia, żeby były dane do wykresów nawet gdy nikt nie patrzy na zakładkę.
36. Jako system gdy jedno urządzenie jest offline podczas zbierania pomiarów chcę pominąć je i kontynuować resztę, żeby jeden błąd nie zatrzymał całej rundy.
37. Jako owner po usunięciu gospodarstwa chcę, żeby poświadczenia Tuya, urządzenia i pomiary zostały skasowane (kaskadowo), żeby nie zostały sieroty.

## Implementation Decisions

### Architektura ogólna

- **Provider:** Tuya IoT Open API v1.0. Operacje: token (HMAC sign) → status (`/v1.0/iot-03/devices/{id}/status`), lista funkcji (`/functions` lub `/specification`), sterowanie (`POST /v1.0/iot-03/devices/{id}/commands`), info (`/devices/{id}`), lista konta (`/users/{uid}/devices`).
- **Granica systemu:** frontend nigdy nie woła Tuya bezpośrednio i nigdy nie dostaje `client_secret`. Wszystkie wywołania idą przez backend Hono (Cloudflare Workers) z autoryzacją JWT cookie.
- **Bazowy kod:** port istniejącego, działającego spike (`buildStringToSign`, `calcSign`, `getToken`, `getDeviceStatus`, `formatStatuses`) do `server/src/tuya/`, plus nowe `getDeviceFunctions` i `sendCommands`.

### Poświadczenia — własne konto per gospodarstwo (BYO)

- **Każde gospodarstwo ma własne konto Tuya i własne sekrety.** Owner wpisuje w panelu apki: Client ID, Client Secret, Device ID, datacenter (region).
- Zapis w nowej tabeli `tuya_credentials` (PK = `household_id`), pola `client_id`/`client_secret` szyfrowane **AES-GCM** kluczem `FINANCE_DATA_KEY` (tym samym co dane finansowe). Secret deszyfrowany tylko w Workerze na czas requestu, nigdy nie zwracany do frontu.
- Brak globalnego współdzielonego projektu Tuya. Aplikacja nie trzyma kluczy Tuya w Workers secrets (poza wartościami devowymi do spike).
- Token Tuya cache'owany per `household_id` (~2 h ważności), odświeżany przy 401.

### Model danych (nowe tabele + opcjonalna kolumna)

- `tuya_credentials` — household_id (PK), client_id_enc, client_secret_enc, datacenter, verified_at, created_by, updated_at.
- `smart_devices` — id, household_id, tuya_device_id (UNIQUE), display_name, product_name, product_id, device_type, functions_json (snapshot zapisywalnych DP do renderu kontrolek), is_active, created_by, timestamps.
- `device_energy_snapshots` — id, device_id, recorded_at, power_w, energy_kwh, switch_on, is_online. Indeks (device_id, recorded_at DESC). Retencja 400 dni (dla zakresu „1 rok").

### Permissions

- **Owner:** poświadczenia Tuya (zapis/edycja/usunięcie), dodawanie/usuwanie/edycja urządzeń, odświeżanie listy, **sterowanie**.
- **Member:** podgląd statusu i wykresów **oraz sterowanie** (wł./wył. i pozostałe DP) — to wspólne gospodarstwo. Bez dostępu do poświadczeń i zarządzania urządzeniami.
- **Guest:** zakładka ukryta / komunikat o logowaniu; zero wywołań API.
- Każda komenda sterująca logowana w `action_log` (`resource_type='device_command'`, `after = { device_id, code, value }`).

### Sterowanie (maksymalny zakres)

- Po dodaniu urządzenia backend pobiera i cache'uje listę zapisywalnych DP (`functions_json`).
- Frontend renderuje kontrolki dynamicznie wg typu DP: bool → przełącznik, enum → select, value → suwak z `min/max/step/scale`.
- Komendy walidowane po stronie backendu względem `functions_json` (tylko zapisywalne DP, wartość w zakresie) przed wysłaniem do Tuya.

### Wykresy

- Pomiar zbierany cronem co 15 min do `device_energy_snapshots`.
- Endpoint historii przyjmuje zakres `7d|30d|90d|1y` i zwraca serie **agregowane po stronie SQL** (bucketing: ~1 h dla 7d, ~6 h dla 30d, ~1 dzień dla 90d/1y) — kilkadziesiąt–kilkaset punktów, nie surowe tysiące. Dla każdego bucketu: średnia/szczyt mocy + delta kWh.
- Frontend: segmented control zakresu + wykres (recharts, jak istniejący `ForecastChart`).

### Granice i integracje

- Nawigacja: lekki query param `?view=urzadzenia` w istniejącym Dashboard, bez wprowadzania React Routera.
- Prywatność: polityka prywatności wymienia Tuya jako processor; przetwarzane są identyfikatory urządzeń i dane zużycia; poświadczenia API trzymane szyfrowane.

## Validation Strategy

### Per grupa user stories

| Stories | Jak weryfikować |
|---|---|
| 1–8 (poświadczenia) | Integration test: `PUT credentials` z dobrymi danymi → `verified_at` ustawione; ze złymi → 400, nic nie zapisane. Test: `client_secret` nie wraca w żadnym GET. Member → 403. |
| 9–15 (urządzenia) | Integration test z mock Tuya: dodanie po ID → widać w liście z `functions_json`; nieznane ID → 404; duplikat w innym household → 409; member → 403 na POST/DELETE/PATCH. |
| 16–22 (status) | Manual E2E: prawdziwe gniazdo Gosund → karta pokazuje moc po obciążeniu; Tuya down → graceful komunikat; guest → brak zakładki. |
| 23–29 (sterowanie) | Manual E2E: przełącznik realnie włącza/wyłącza gniazdo (potwierdzone kolejnym statusem). Test: komenda spoza zapisywalnych DP → 400. Test: komenda zapisana w `action_log`. Guest → 403. |
| 30–34 (wykresy) | Test: `history?range=…` zwraca różną liczbę bucketów per zakres; delta kWh zgadza się z różnicą skrajnych snapshotów; brak danych → empty state. |
| 35–37 (tło/ops) | Test: cron zapisuje snapshoty (widać w DB po 30 min); urządzenie offline → log, batch leci dalej; usunięcie household → CASCADE czyści credentials/devices/snapshots. |

### „Done" dla głównych komponentów

- **Klient Tuya (`tuya/client`):** każdy używany endpoint (token, status, functions, commands, info, lista konta) ma test z mock fetch — happy path + błąd (4xx/5xx). Podpis HMAC zgodny z fixture ze spike. To deep module: prosty interfejs (`getDeviceStatus`, `sendCommands`, `getDeviceFunctions`), cała logika podpisu/tokenów schowana w środku, weryfikowalny niezależnie od reszty apki.
- **Szyfrowanie poświadczeń:** round-trip enc/dec; secret nigdy w odpowiedzi API.
- **Renderer kontrolek (`DeviceControls`):** dla urządzenia z mieszanką DP (bool + enum + value) renderuje odpowiednio toggle + select + slider; nieznany typ → fallback.
- **Agregacja historii:** zapytanie zwraca poprawne buckety i delty dla każdego zakresu; szybkie dla 1 roku.
- **Frontend:** build ✓, manual smoke pełnego flow (konfiguracja → dodanie → sterowanie → wykres).

### Progi jakości

- Status batch: timeout 8 s, równoległość limitowana (np. 3 naraz), `Promise.allSettled` — jedno wolne urządzenie nie blokuje reszty.
- Komenda sterująca: potwierdzenie zmiany stanu w kolejnym odczycie statusu.
- Wykres 1 rok: ładowanie zagregowanych serii bez zawieszenia UI.

## Out of Scope

- **Powiązanie z budżetem domowym** — świadomie wycięte. Brak liczenia kosztu prądu, brak tworzenia wpisów wydatków z zużycia. To samodzielny moduł monitoringu + sterowania.
- **Automatyka / scenariusze / harmonogramy** (np. „włącz o 18:00", reguły warunkowe) — poza zakresem; robimy sam akt sterowania, nie logikę automatyzacji.
- **Integracje z obcymi ekosystemami** — Home Assistant, Matter, Google Home, Alexa.
- **Globalny współdzielony projekt Tuya** — odrzucone; każde gospodarstwo ma własne konto i własne poświadczenia.
- **Sterowanie poza tym, co Tuya wystawia jako zapisywalne DP** — nie wymyślamy własnych funkcji, ograniczamy się do możliwości urządzenia.
- **Mobilne push notyfikacje** o stanie urządzeń.

## Further Notes

### Komponenty (kandydaci do deep modules)

1. **Klient Tuya** — podpis HMAC + token + wywołania REST schowane za prostym interfejsem; testowalny w izolacji.
2. **Warstwa szyfrowania poświadczeń** — enc/dec na `FINANCE_DATA_KEY`, jeden punkt styku.
3. **Renderer kontrolek per DP** — mapowanie typów DP → komponenty UI, rozszerzalne na nowe typy urządzeń.
4. **Agregator historii** — bucketing/delty w SQL za jednym endpointem zakresowym.

### Fazowanie (patrz `plans/smart-devices-tuya.md`)

- Phase 1: klient Tuya na backendzie + sterowanie (smoke).
- Phase 2: panel poświadczeń + rejestr urządzeń + CRUD.
- Phase 3: zakładka UI + status live + sterowanie (max DP).
- Phase 4: pomiary w tle + wykresy 7d/30d/90d/1y.

### Instrukcja podłączenia (wymagana w UI + README)

Trzy kroki dla klienta: (1) dodaj urządzenia w aplikacji Tuya/Smart Life; (2) powiąż konto z własnym projektem deweloperskim w Tuya Cloud (Create Cloud Project EU → Link App Account → włącz Device Status / Management / Control); (3) wpisz w panelu apki Client ID, Client Secret, Device ID, datacenter (`eu`). Po zapisie apka od razu weryfikuje połączenie.

### Ryzyka

- Klient pomyli region (EU/US) → token nie działa → walidacja przy zapisie z czytelnym błędem.
- Różne kody DP per produkt → generyczny renderer + fallback `raw`.
- Limit API Tuya → cache tokena per household, batch z limitem równoległości, cron 15 min.
- 1 rok danych → agregacja w SQL, nie surowe punkty.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
