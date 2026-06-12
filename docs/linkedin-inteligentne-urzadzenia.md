# Budżet domowy i inteligentne gniazdka w jednym miejscu — co dodałem do HomeCashflow

> Tekst na LinkedIn (artykuł lub dłuższy post).  
> Produkt: [homecashflow.org](https://homecashflow.org)

Mam w domu gniazdka Tuya. Zużycie prądu sprawdzałem w Smart Life, budżet — w Excelu, a potem we własnej apce. Dwa światy, dwa logowania, zero spójnego obrazu: *ile kosztuje miesiąc* i *co akurat teraz ciągnie prąd*.

Dlatego w **HomeCashflow** — aplikacji do wspólnego budżetu domowego — pojawiła się nowa zakładka: **Inteligentne urządzenia**.

---

## Problem, który chciałem rozwiązać

HomeCashflow od początku służy do jednej rzeczy: **wspólnego gospodarstwa domowego** — przychody, stałe i zmienne wydatki, cele oszczędnościowe, prognoza na koniec roku. To działa, gdy dane wpisujesz ręcznie.

Ale coraz więcej domowych kosztów ma **elektroniczny ślad**: gniazdka z pomiarem mocy, lampy, grzałki podłączone przez Tuya. Te dane żyją gdzie indziej. Każde sprawdzenie „czy coś zostało włączone” to context switch do innej aplikacji. Każda analiza zużycia — osobny wykres, bez powiązania z tym, jak wygląda reszta finansów domu.

Chciałem **jednego miejsca**, do którego i tak codziennie zaglądam — i tam zobaczyć nie tylko budżet, ale też urządzenia.

---

## Co dokładnie doszło

### Zakładka „Inteligentne urządzenia”

Obok widoku budżetu jest druga zakładka. Po zalogowaniu widać karty podpiętych urządzeń: czy są online, czy włączone, jaka jest chwilowa moc, napięcie i zużycie energii.

Nie trzeba już otwierać Smart Life tylko po to, żeby sprawdzić, czy gniazdko w garażu nadal żre 800 W.

### Własne konto Tuya per gospodarstwo

Każde gospodarstwo domowe w HomeCashflow może podpiąć **własne** poświadczenia z panelu deweloperskiego Tuya (Client ID, Secret, region). Sekrety są szyfrowane i trzymane po stronie serwera — nie wracają do przeglądarki.

Właściciel konfiguruje integrację raz. Pozostali domownicy widzą urządzenia i mogą z nich korzystać — bez dostępu do kluczy API.

### Sterowanie bez wychodzenia z apki

Z karty urządzenia można je **włączyć lub wyłączyć**. Dla bardziej złożonych urządzeń interfejs buduje się dynamicznie z tego, co dany model wystawia w Tuya — suwaki, tryby, przełączniki. Jedna apka zamiast skakania między ekranami.

### Wykresy zużycia energii

To był najtrudniejszy kawałek technicznie.

Gniazdka Tuya raportują energię w specyficzny sposób — surowe wartości z API to nie zawsze „licznik na ścianie”, tylko **przyrosty zdarzeniowe**. Źle odczytane dane dawały absurdalne wykresy.

Po kilku iteracjach mamy:

- zbieranie pomiarów **w tle** (nawet gdy nikt nie patrzy na zakładkę),
- wykresy w zakresach **7 / 30 / 90 dni** i **rok**,
- podsumowanie: **zużycie kWh** i **szczyt mocy** w wybranym okresie,
- czas w strefie **Europe/Warsaw** — bo o północy UTC wykres wyglądał jakby ktoś przesunął ścianę.

Efekt: widać, czy tydzień był droższy od poprzedniego nie tylko w kategorii „Prąd” w budżecie, ale **urządzenie po urządzeniu**.

---

## Dla kogo to ma sens

- **Pary i rodziny** ze wspólnym budżetem — jeden widok dla wszystkich domowników.
- **Osoby z inteligentnym domem na Tuya** (np. gniazdka Gosund z pomiarem mocy).
- **Ludzie, którzy lubią widzieć liczby**, nie tylko włączać lampkę w aplikacji producenta.

Moduł urządzeń jest **samodzielny** — nie musisz od razu wpisywać zużycia do wydatków. To warstwa monitoringu i sterowania obok budżetu, nie zamiast niego.

---

## Co za tym stoi (dla ciekawskich)

HomeCashflow to side project, który rozwijam na żywo:

- frontend: **React + Vite**, deploy na **Cloudflare Pages**,
- backend: **Hono** na **Cloudflare Workers**,
- baza: **Neon PostgreSQL**,
- integracja: **Tuya Open API** (region EU),
- auth: **Google OAuth** + wspólne gospodarstwa z zaproszeniami e-mail.

Nowa funkcja to kolejny **vertical slice**: spike w Node.js → klient API na Workerze → UI → wykresy → poprawki dokładności danych. Klasyczna ścieżka „najpierw niech działa u mnie w domu”.

---

## Co dalej

Na liście m.in.:

- dalsze dopracowanie dokładności pomiarów dla różnych modeli gniazdek,
- ewentualne **powiązanie zużycia z budżetem** (szacowany koszt prądu → propozycja wydatku),
- więcej typów urządzeń poza gniazdkami.

---

## Podsumowanie

Budżet domowy i smart home nie muszą żyć w osobnych aplikacjach. Jeśli i tak codziennie sprawdzasz finanse gospodarstwa, warto **w tym samym miejscu** widzieć też to, co zużywa prąd — i móc to wyłączyć jednym kliknięciem.

To jest dokładnie kierunek, w którym poszedł HomeCashflow.

👉 **homecashflow.org**

---

Jeśli budujesz własny smart home albo wspólny budżet w parze — daj znać w komentarzu, jak to u Ciebie wygląda. Chętnie usłyszę, czy łączycie te światy, czy trzymacie je osobno.

**#HomeCashflow #SmartHome #Tuya #IoT #BudżetDomowy #SideProject #React #Cloudflare #FinTechPersonal #ProductDevelopment**

---

## Wariant krótszy (post)

Budżet domowy w jednej apce. Zużycie prądu — w innej. Znacie to?

W **HomeCashflow** doszła zakładka **Inteligentne urządzenia**: podpinasz swoje konto Tuya, widzisz gniazdka i lampy na żywo (moc, napięcie, kWh), sterujesz nimi bez Smart Life i masz wykresy zużycia na 7 / 30 / 90 dni i rok.

Każde gospodarstwo ma własne poświadczenia API — szyfrowane po stronie serwera. Właściciel konfiguruje, domownicy korzystają.

Najtrudniejsze były wykresy: Tuya nie zwraca „licznika jak w kWh na fakturze”, tylko przyrosty zdarzeniowe. Kilka iteracji później — sensowne liczby i strefa Europe/Warsaw.

Side project na React + Cloudflare Workers + Neon. Klasycznie: najpierw u mnie w domu, potem na produkcji.

👉 homecashflow.org

#HomeCashflow #SmartHome #Tuya #SideProject
