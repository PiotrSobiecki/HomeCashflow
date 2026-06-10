# Plan: Inteligentne urządzenia (Tuya Open API)

> Source PRD: [issue #21](https://github.com/PiotrSobiecki/HomeCashflow/issues/21) · kopia lokalna: `plans/prd-smart-devices-tuya.md`
> Spike (działający): `kopalnie_krypto/crm/scripts/tuya-spike.mjs`

## Architectural decisions

Decyzje durable, obowiązujące we wszystkich fazach:

- **Architecture style**: cienki klient HTTP do Tuya IoT Open API v1.0 (podpis HMAC → token → status/funkcje/komendy) uruchamiany w backendzie Hono na Cloudflare Workers. Frontend nigdy nie woła Tuya bezpośrednio ani nie dostaje `client_secret` — wszystko przez API z JWT cookie. Token cache'owany per gospodarstwo (~2 h, odświeżany przy 401). Bez webhooków, bez kolejek.
- **Poświadczenia (własne konto per gospodarstwo, BYO)**: każde gospodarstwo ma własne konto Tuya i własne sekrety. Owner wpisuje w panelu apki Client ID, Client Secret, Device ID, datacenter (region). `client_id`/`client_secret` szyfrowane AES-GCM tym samym kluczem co dane finansowe (`FINANCE_DATA_KEY`), deszyfrowane tylko w Workerze na czas requestu, nigdy nie zwracane do frontu. Brak globalnego współdzielonego projektu Tuya.
- **Key entities**:
  - `tuya_credentials` — 1 row per gospodarstwo (PK = household_id): zaszyfrowane client_id/secret, datacenter, `verified_at`.
  - `smart_devices` — N per gospodarstwo: `tuya_device_id` (UNIQUE globalnie), nazwa, typ, snapshot zapisywalnych funkcji DP (do renderu kontrolek), flaga aktywności.
  - `device_energy_snapshots` — pomiary w czasie (power, energy_kwh, switch, online), retencja 400 dni dla zakresu „1 rok".
- **Auth / Permissions**: **Owner** — poświadczenia, dodawanie/usuwanie/edycja urządzeń, sterowanie. **Member** — podgląd statusu i wykresów **oraz sterowanie** (wspólne gospodarstwo), bez dostępu do poświadczeń i zarządzania urządzeniami. **Guest** — zakładka ukryta, zero wywołań API. Każda komenda sterująca logowana w `action_log` (`resource_type='device_command'`).
- **Integrations**: Tuya jako jedyny provider i data processor. Zakres ograniczony do statusu, sterowania i pomiarów — bez automatyki, scenariuszy i obcych ekosystemów. Brak powiązania z budżetem domowym.
- **Kasowanie**: usunięcie gospodarstwa kaskadowo czyści poświadczenia, urządzenia i pomiary.
- **Instrukcja podłączenia**: 3-krokowy przewodnik (dodaj urządzenia w apce Tuya → powiąż konto z własnym projektem deweloperskim → wpisz dane w panelu) wymagany w UI i README — treść w PRD (Further Notes).

---

## Phase 1: Podłączenie konta Tuya

**User stories**: 1, 2, 3, 4, 5, 6, 7, 8

### What to build

Pełny pionowy przekrój samego podłączenia konta, bez urządzeń. Owner otwiera w ustawieniach gospodarstwa sekcję „Integracja Tuya" z formularzem (Client ID, Client Secret, Device ID, datacenter) i linkiem do instrukcji krok-po-kroku. Po zapisaniu backend szyfruje sekrety, od razu weryfikuje je realnym pobraniem tokena z Tuya i zapisuje tylko gdy weryfikacja przeszła — w przeciwnym razie zwraca czytelny błąd (zły klucz / zły region). Panel pokazuje status „Połączono ✓ / Niepołączono". Owner może rozłączyć (usunięcie poświadczeń). Member nie widzi tej sekcji. `client_secret` nigdy nie wraca do przeglądarki. Tabela `tuya_credentials` powstaje w tej fazie; klient Tuya (podpis HMAC + token) zostaje wniesiony z istniejącego spike.

### Acceptance criteria

- [ ] Owner zapisuje poprawne poświadczenia → status „Połączono", `verified_at` ustawione
- [ ] Błędne poświadczenia lub zły region → czytelny błąd PL, nic nie zapisane
- [ ] `client_secret` nigdy nie pojawia się w żadnej odpowiedzi API
- [ ] Sekrety zaszyfrowane w spoczynku (AES-GCM), deszyfrowane tylko na czas requestu
- [ ] Owner może rozłączyć integrację (usunięcie poświadczeń)
- [ ] Member dostaje 403 / nie widzi panelu poświadczeń
- [ ] Instrukcja 3-krokowa dostępna z panelu
- [ ] Manual E2E: prawdziwe konto Tuya (sandbox/realne) → token pobrany, status zielony

---

## Phase 2: Dodanie urządzenia + podgląd na żywo

**User stories**: 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22

### What to build

Owner dodaje urządzenie wpisując Device ID lub wybierając z listy powiązanego konta (discover); backend weryfikuje istnienie urządzenia na koncie Tuya tego gospodarstwa, pobiera i cache'uje listę zapisywalnych funkcji DP, i zapisuje urządzenie. Próba dodania nieznanego ID → błąd „nie znaleziono"; ID już przypisanego do innego gospodarstwa → konflikt. Owner może zmienić nazwę, dezaktywować i usunąć urządzenie (bez kasowania w chmurze Tuya). Powstaje nowa zakładka „Inteligentne urządzenia" (lekki routing query param) z siatką kart pokazujących status na żywo: online/offline, chwilowa moc, napięcie, skumulowane zużycie, czas ostatniej aktualizacji. Status odświeża się sam gdy zakładka jest otwarta; jest też ręczne odświeżenie pojedynczego urządzenia. Gdy Tuya nie odpowiada — łagodny komunikat zamiast zepsutej karty. Member widzi wszystko w trybie odczytu zarządzania; guest nie widzi zakładki. Tabela `smart_devices` powstaje w tej fazie.

### Acceptance criteria

- [ ] Owner dodaje urządzenie po ID → pojawia się na liście z zapisanymi funkcjami DP
- [ ] Discover zwraca urządzenia z konta gospodarstwa; wybór dodaje bez ręcznego ID
- [ ] Nieznane ID → 404 „nie znaleziono w Tuya"; duplikat w innym gospodarstwie → 409
- [ ] Owner zmienia nazwę, dezaktywuje i usuwa urządzenie; member dostaje 403 na zarządzaniu
- [ ] Zakładka „Inteligentne urządzenia" przełącza się bez przeładowania sesji
- [ ] Karty pokazują live moc/napięcie/zużycie zgodne z odczytem Tuya; auto-refresh na otwartej zakładce
- [ ] Tuya niedostępna → karta z komunikatem „Nie udało się odświeżyć" (graceful)
- [ ] Guest nie widzi zakładki / dostaje komunikat o logowaniu
- [ ] Manual E2E: realne gniazdo → dodane → widać moc po włączeniu obciążenia

---

## Phase 3: Sterowanie urządzeniem

**User stories**: 23, 24, 25, 26, 27, 28, 29

### What to build

Karta urządzenia zyskuje kontrolki sterujące generowane dynamicznie z zapisywalnych funkcji DP urządzenia: przełącznik dla wł./wył., suwak dla wartości z zakresem (jasność, temperatura barwowa), lista dla trybów/enumów — czyli maksymalny zakres tego, co dany model wystawia. Każdy domownik (owner i member) może sterować; guest nie. Po kliknięciu frontend wysyła polecenie przez backend, który waliduje kod i wartość względem zapisanych funkcji DP (tylko zapisywalne, w zakresie) przed przekazaniem do Tuya, a po sukcesie loguje akcję w historii zmian (kto, kiedy, co). UI daje potwierdzenie (toast) i szybko odświeża stan; przy błędzie pokazuje komunikat, że stan się nie zmienił.

### Acceptance criteria

- [ ] Przełącznik na karcie realnie włącza/wyłącza urządzenie (potwierdzone kolejnym statusem)
- [ ] Kontrolki renderują się dynamicznie z funkcji DP (urządzenie bool+enum+value → toggle+select+slider)
- [ ] Komenda do niezapisywalnego DP lub wartość poza zakresem → odrzucona (400) przed wysłaniem do Tuya
- [ ] Każde polecenie zapisane w `action_log` z autorem i wartością
- [ ] Member może sterować; guest dostaje 403
- [ ] Nieudana komenda → czytelny komunikat błędu, brak fałszywego potwierdzenia
- [ ] Manual E2E: pełne sterowanie realnym urządzeniem (toggle + zmiana wartości)

---

## Phase 4: Wykresy zużycia + zbieranie w tle

**User stories**: 30, 31, 32, 33, 34, 35, 36, 37

### What to build

Zaplanowane zadanie w tle (co 15 min) zapisuje pomiar każdego aktywnego urządzenia (moc, skumulowane zużycie, stan, online), deszyfrując poświadczenia per gospodarstwo; urządzenie offline jest pomijane, runda leci dalej. Endpoint historii przyjmuje zakres 7 dni / 30 dni / 90 dni / 1 rok i zwraca serie agregowane po stronie bazy (bucketing rosnący z zakresem — od godzin do dni), tak by długie zakresy ładowały się szybko zamiast tysięcy surowych punktów; dla każdego okna liczy zużycie kWh i szczyt mocy. Karta urządzenia dostaje wykres z przełącznikiem zakresu i podsumowaniem (kWh w zakresie, szczyt mocy). Nowe urządzenie bez danych pokazuje stan „za mało pomiarów". Tabela `device_energy_snapshots` powstaje w tej fazie; retencja 400 dni utrzymuje dane dla zakresu rocznego.

### Acceptance criteria

- [ ] Zadanie w tle zapisuje pomiary aktywnych urządzeń (widać w DB po ~30 min)
- [ ] Urządzenie offline pomijane bez przerywania całej rundy
- [ ] Endpoint historii zwraca zagregowane serie dla 7d/30d/90d/1r (różna gęstość bucketów)
- [ ] Delta kWh w zakresie zgadza się z różnicą skrajnych pomiarów (± zaokrąglenia)
- [ ] Przełącznik zakresu zmienia wykres bez przeładowania; długie zakresy ładują się szybko
- [ ] Podsumowanie pokazuje kWh w zakresie i szczyt mocy
- [ ] Nowe urządzenie bez danych → „za mało pomiarów dla tego okresu"
- [ ] Usunięcie gospodarstwa kaskadowo czyści poświadczenia, urządzenia i pomiary

---

## Sequencing

```
Phase 1 (Podłączenie konta)
   └──► Phase 2 (Dodanie urządzenia + status live)
           └──► Phase 3 (Sterowanie)
           └──► Phase 4 (Wykresy + tło)
```

Phase 1 → 2 są strictly sekwencyjne (bez konta nie ma urządzeń; bez urządzeń nie ma czym sterować ani co mierzyć). Phase 3 i 4 są niezależne od siebie po Phase 2 i mogą iść w dowolnej kolejności lub równolegle.

## Estymata (luźna, pojedynczy dev)

| Phase | Estymata |
|---|---|
| 1 | 2-3 dni |
| 2 | 4-6 dni |
| 3 | 3-4 dni |
| 4 | 3-5 dni |

Każda faza = osobny PR merge'owalny do `main` (frontend Pages + deploy API).
