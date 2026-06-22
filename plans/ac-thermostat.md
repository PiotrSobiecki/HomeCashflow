# Plan: Termostat zewnętrzny dla klimy IR (Tuya ir_ac)

> Source PRD: [GitHub Issue #48](https://github.com/PiotrSobiecki/HomeCashflow/issues/48)

## Architectural decisions

Trwałe decyzje obowiązujące we wszystkich fazach:

- **Architecture style**: rozszerzenie istniejącego backendu Hono na Cloudflare Workers; logika automatyki odpalana z handlera `scheduled` (cron). Wzorzec orkiestracji jak `fireDueTimers` w `device-timers.js`.
- **Zakres urządzeń**: tylko Tuya IR `device_type = 'ir_ac'`. Akcja wyłącznie `power` 0/1 przez istniejące `sendAcCommand`. Tryb i temperatura docelowa nie są wymuszane.
- **Logika sterująca (deep module)**: czysta funkcja `decide({ temp, tempOn, tempOff, lastAction }) → 'on' | 'off' | null`. Histereza dwuprogowa + edge-trigger (komenda tylko gdy akcja różni się od `lastAction`). Zero I/O.
- **Dostawca pogody (deep module)**: Open-Meteo — bez klucza API, darmowe (non-commercial), przez `fetch` na Workers. Geocoding (miasto → lat/lon) oraz odczyt bieżącej temperatury 2 m. Warstwa wydzielona, by łatwo podmienić providera.
- **Data model**: nowa tabela `ac_thermostats` (1:1 do `smart_devices`, powiązana z `household`). Pola: `enabled`, `location_label`, `lat`, `lon`, `temp_on`, `temp_off`, `last_action ('on'|'off'|null)`, `last_outdoor_temp`, `last_checked_at`. Konfiguracja per urządzenie.
- **Harmonogram**: cron projektu pozostaje `*/5 * * * *`; termostat to dodatkowa gałąź `minuta % 30 === 0` obok timerów (5 min), energii (15 min) i tokenów ST (12h). Działanie 24/7.
- **Niezawodność**: błąd pogody lub Tuya dla danego wpisu → log + pominięcie tego wpisu, bez zmiany stanu klimy. Inicjalizacja `last_action = null` → pierwsza akcja dopiero przy przekroczeniu progu.
- **Walidacja**: `temp_on > temp_off` z minimalną strefą martwą (≥1°C), egzekwowana w API i UI.
- **Niezależność**: brak koordynacji z wyłącznikiem czasowym (`device_timers`) w tej wersji.

---

## Phase 1: Walking skeleton — pętla sterująca cron → Tuya (temperatura na sztywno)

**User stories**: 1, 4, 6, 7, 8, 9, 11, 16, 18 (częściowo 5, 14)

### What to build

Najcieńsza kompletna ścieżka end-to-end, która udowadnia najbardziej ryzykowną integrację (cron → decyzja → realna komenda Tuya), z zapogodą zastąpioną wartością wpisywaną do konfiguracji.

- Migracja tabeli `ac_thermostats` (pełny kształt z decyzji architektonicznych).
- Endpointy API do zapisu/odczytu konfiguracji termostatu per `ir_ac` (na tym etapie temperatura testowa wpisywana wprost zamiast lat/lon + API pogody).
- Czysta funkcja `decide()` z pełną histerezą i edge-triggerem.
- Nowa gałąź w handlerze `scheduled` (`minuta % 30`): pobranie aktywnych termostatów (JOIN do `smart_devices` + `tuya_credentials`, cache tokenu Tuya per gospodarstwo), wywołanie `decide()`, ewentualny `sendAcCommand(power)`, zapis `last_action`.

### Acceptance criteria

- [ ] Testy jednostkowe `decide()` przechodzą dla pełnej tablicy przypadków (poniżej/powyżej/strefa martwa/duplikat/granice ≥ i ≤/`lastAction=null`).
- [ ] Zapis konfiguracji termostatu dla urządzenia `ir_ac` działa i jest powiązany z gospodarstwem.
- [ ] Gałąź crona `%30` odpala runner; pozostałe gałęzie (timery, energia, ST) działają bez zmian.
- [ ] Test integracyjny (wzorzec projektu, realny Tuya test): testowa temp ≥ `temp_on` i `last_action != 'on'` → wysłano `power=1`, zapisano `last_action='on'`; analogicznie wyłączenie; strefa martwa → brak komendy.
- [ ] Wpis z `last_action='on'` przy temp nadal powyżej progu nie wysyła powtórnej komendy.

---

## Phase 2: Realna temperatura z Open-Meteo (lat/lon na sztywno)

**User stories**: 6, 7, 14

### What to build

Podmiana testowej temperatury na realny odczyt z Open-Meteo dla współrzędnych zapisanych w `ac_thermostats` (lat/lon na razie wprowadzane wprost, bez geocodingu). Wydzielenie modułu „Dostawca pogody".

- Funkcja odczytu bieżącej temperatury 2 m dla lat/lon przez Open-Meteo.
- Runner używa realnej temperatury; zapisuje `last_outdoor_temp` i `last_checked_at`.
- Obsługa awarii (timeout, błąd HTTP, brak danych) → pominięcie wpisu, brak komendy, log.

### Acceptance criteria

- [ ] Odczyt temperatury dla znanych współrzędnych zwraca poprawną wartość liczbową (test z zamockowaną odpowiedzią Open-Meteo).
- [ ] Błąd/timeout API → wyjątek złapany przez runner; stan klimy i `last_action` bez zmian; `last_checked_at` nieaktualizowane lub oznaczone jako nieudane (spójnie z implementacją).
- [ ] Po udanym cyklu `last_outdoor_temp` i `last_checked_at` są zapisane.
- [ ] Test integracyjny: zamockowana temp przekraczająca próg wyzwala odpowiednią komendę Tuya.

---

## Phase 3: Geocoding miasta po nazwie

**User stories**: 2, 3, 5

### What to build

Użytkownik podaje miejscowość po nazwie; backend zamienia ją na lat/lon raz przy zapisie i utrwala `label` + współrzędne.

- Funkcja geocodingu (Open-Meteo Geocoding API): nazwa → `{lat, lon, label}`.
- Endpoint zapisu miasta wyzwala geocoding; zwraca zweryfikowany `label` i współrzędne do potwierdzenia.
- Walidacja: brak wyniku geocodingu → czytelny błąd; `temp_on > temp_off` (min. strefa martwa).

### Acceptance criteria

- [ ] Zapis znanego miasta zapisuje sensowne lat/lon + `label`.
- [ ] Nieznane/puste miasto → błąd obsłużony, konfiguracja niezapisana.
- [ ] `temp_on <= temp_off` odrzucone z czytelnym komunikatem.
- [ ] Zgeokodowane współrzędne są następnie używane przez runner (spójność z Fazą 2).

---

## Phase 4: UI „Termostat zewnętrzny" w panelu klimy

**User stories**: 10, 12, 13, 15, 17

### What to build

Sekcja konfiguracji i podglądu w panelu sterowania klimą IR (`AcControls`), spinająca wszystko w interfejs użytkownika.

- Toggle aktywności automatyki per urządzenie.
- Pole miasta (zapis wyzwala geocoding z Fazy 3) i dwa pola progów z walidacją.
- Podgląd: ostatnio odczytana temperatura zewnętrzna, czas ostatniego sprawdzenia, ostatnia akcja automatyki.
- Delikatne ostrzeżenie, że włączenie używa ostatniego trybu z pilota (ryzyko „grzania w upał").

### Acceptance criteria

- [ ] Użytkownik może włączyć/wyłączyć automatykę dla konkretnej klimy IR z UI.
- [ ] Miasto i progi można ustawić i zapisać; błędy walidacji są widoczne.
- [ ] UI pokazuje `last_outdoor_temp`, `last_checked_at` i `last_action`.
- [ ] Ostrzeżenie o trybie pilota jest widoczne przy włączaniu automatyki.
- [ ] Sekcja pojawia się tylko dla urządzeń `ir_ac`.
