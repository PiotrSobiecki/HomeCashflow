# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| main    | ✅        |

## Reporting a Vulnerability

**Do not report security vulnerabilities through public GitHub issues.**

Instead:
1. Email piotr@sobiecki.org z opisem problemu
2. Dołącz kroki do odtworzenia, jeśli to możliwe
3. Daj rozsądny czas na naprawę przed publicznym ujawnieniem

## What to Report

- Ominięcie autoryzacji (dostęp do household bez członkostwa, eskalacja roli Guest/Member/Owner)
- Wyciek danych finansowych innego gospodarstwa domowego
- Podatności w tokenach zaproszeń (przewidywalność, brak wygasania, reużycie)
- Nieprawidłowości w JWT / cookies sesji (np. brak flagi httpOnly, słaba weryfikacja)
- Injection (SQL, XSS itp.)
- Sekrety ujawnione w kodzie, logach lub odpowiedziach API
- Błędna konfiguracja Cloudflare Workers lub Neon (np. otwarte endpointy bez auth)

## Response

Staramy się:
- Potwierdzić otrzymanie zgłoszenia w ciągu 48 godzin
- Dać wstępną ocenę w ciągu tygodnia
- Wydać poprawkę tak szybko, jak to praktycznie możliwe

## Security Best Practices for Contributors

- Nigdy nie commituj sekretów, kluczy API ani danych logowania
- Sekrety trzymaj w zmiennych środowiskowych (`.env`, `.dev.vars`), nigdy w kodzie
- Waliduj wszystkie dane wejściowe od użytkownika
- Pamiętaj, że `finance_data` to dane wrażliwe (finanse gospodarstwa domowego) — traktuj je jak dane osobowe
