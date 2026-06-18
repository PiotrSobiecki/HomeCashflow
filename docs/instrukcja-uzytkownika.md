# Instrukcja uzytkownika HomeCashflow

Ta instrukcja opisuje szybki start i najwazniejsze scenariusze pracy z aplikacja.

## 1. Start

1. Otworz aplikacje w przegladarce.
2. Wybierz:
   - `Zaloguj sie przez Google` - aby zapis danych byl w chmurze i we wspolnym gospodarstwie,
   - `Kontynuuj bez logowania` - aby przetestowac aplikacje lokalnie (tryb goscia).

## 2. Tryb goscia

1. Dane sa zapisywane lokalnie w tej konkretnej przegladarce.
2. Dane znikna po wyczyszczeniu storage/cookies lub zmianie urzadzenia.
3. Tryb goscia jest najlepszy do testow i szybkiego zapoznania sie z interfejsem.

## 3. Praca na koncie Google

1. Po pierwszym logowaniu tworzony jest profil Uzytkownika.
2. Mozesz zarzadzac finansami samodzielnie lub w ramach wspolnego gospodarstwa.
3. Dane sa przechowywane na backendzie aplikacji.

## 4. Gospodarstwo domowe i zaproszenia

1. Wlasciciel gospodarstwa moze zapraszac innych czlonkow przez e-mail.
2. Zaproszona osoba musi zalogowac sie adresem zgodnym z zaproszeniem.
3. Po zaakceptowaniu zaproszenia czlonkowie widza te same dane gospodarstwa.

## 5. Codzienne korzystanie

1. Dodawaj przychody i wydatki (stale oraz zmienne).
2. Ustawiaj cele oszczednosciowe i obserwuj postep.
3. Sprawdzaj podsumowania miesieczne i prognoze finansowa.
4. Korzystaj z metryk (np. poduszka bezpieczenstwa, biezacy limit wydatkow).

## 6. Inteligentne urzadzenia (zakladka "Urzadzenia")

Zakladka pozwala podlaczyc urzadzenia smart home z chmury Tuya (np. gniazdka
z pomiarem energii) oraz urzadzenia SmartThings/Samsung (np. AGD: pralka,
suszarka, zmywarka) i sledzic ich zuzycie pradu.

### 6.1 Polaczenie konta Tuya (tylko wlasciciel gospodarstwa)

1. Sparuj urzadzenia w aplikacji Tuya Smart / Smart Life.
2. Na iot.tuya.com utworz Cloud Project (region EU), zlinkuj konto z aplikacji
   (Link App Account) i wlacz uprawnienia Device Status / Management / Control.
3. W zakladce "Urzadzenia" wpisz Client ID i Client Secret z projektu oraz region.
4. W formularzu "Zmien dane" mozesz ustawic cene za 1 kWh (w zl) - na jej
   podstawie aplikacja liczy koszty energii.

### 6.2 Polaczenie konta SmartThings (tylko wlasciciel gospodarstwa)

1. Urzadzenia musza byc wczesniej dodane w aplikacji SmartThings (Samsung).
2. W zakladce "Urzadzenia" wybierz polaczenie SmartThings i zaloguj sie kontem
   Samsung (OAuth) - zatwierdzasz zakres uprawnien do odczytu statusu i sterowania.
3. Aplikacja przechowuje tokeny dostepu w postaci zaszyfrowanej; mozesz w kazdej
   chwili odlaczyc konto, a dostep cofnac takze w ustawieniach konta Samsung.
4. Pralka/AGD: sterowanie (start/pauza/stop, temperatura, wirowanie, plukanie,
   namaczanie, program) dziala tylko przy wlaczonym na urzadzeniu "zdalnym
   sterowaniu" i gdy urzadzenie nie jest w trakcie cyklu.
5. Nazwy programow pralki mozna nadpisac wlasnymi (przycisk "Nazwy programow"),
   bo SmartThings nie zawsze udostepnia ich oryginalne nazwy.

### 6.3 Praca z urzadzeniami

1. Wlasciciel dodaje urzadzenia przyciskiem "Dodaj urzadzenie" (lista z konta
   Tuya lub SmartThings).
2. Karta urzadzenia pokazuje status na zywo: moc, napiecie, zuzycie od polnocy
   oraz szacowany czas poboru mocy w danym dniu (dla AGD takze stan i ustawienia cyklu).
3. Urzadzeniem mozna sterowac (np. wlaczyc/wylaczyc), o ile jest online.
4. Wykres zuzycia ma zakresy 7/30/90 dni i 1 rok oraz kafelki: zuzycie w okresie,
   szczyt mocy i koszt (gdy ustawiona jest cena za 1 kWh).
5. Status odswieza sie automatycznie co 30 sekund, wykresy co 10 minut;
   przycisk "Odswiez" wymusza natychmiastowe odswiezenie.

### 6.4 Raport zuzycia (PDF)

1. Panel "Raport zuzycia" znajduje sie na dole zakladki.
2. Wybierz zakres dat (maksymalnie rok) i urzadzenia z listy rozwijanej.
3. Raport mozesz pobrac jako PDF albo wyslac na adres e-mail swojego konta.
4. PDF zawiera podsumowanie per urzadzenie (zuzycie, koszt, szczyt mocy,
   czas poboru) oraz tabele zuzycia dziennego.

## 7. Dobre praktyki

1. Aktualizuj dane regularnie (np. codziennie lub co tydzien).
2. Weryfikuj kategorie wydatkow, aby raporty byly czytelne.
3. W przypadku wspolnego gospodarstwa ustalcie wspolne zasady opisu wydatkow.

## 8. Rozwiazywanie problemow

1. Problem z logowaniem Google:
   - odswiez strone i sproboj ponownie,
   - upewnij sie, ze logujesz sie odpowiednim kontem Google.
2. Brak dostepu do zaproszenia:
   - sprawdz, czy e-mail konta Google jest taki sam jak w zaproszeniu.
3. Brak danych w trybie goscia:
   - sprawdz, czy nie zostaly wyczyszczone dane przegladarki.
4. Urzadzenie Tuya pokazuje "Brak polaczenia":
   - sprawdz, czy urzadzenie jest online w aplikacji Tuya Smart / Smart Life,
   - zweryfikuj poswiadczenia i region w panelu "Integracja Tuya".
5. Urzadzenie SmartThings pokazuje "Brak polaczenia" lub nie da sie sterowac:
   - sprawdz, czy urzadzenie jest online w aplikacji SmartThings,
   - przy AGD wlacz "zdalne sterowanie" na urzadzeniu i upewnij sie, ze nie jest
     w trakcie cyklu,
   - jesli polaczenie wygaslo, odlacz i polacz konto Samsung ponownie.
6. Brak kosztow w raporcie lub na wykresie:
   - ustaw cene za 1 kWh w formularzu "Zmien dane" panelu Tuya.

## 9. Dokumenty powiazane

- `docs/regulamin.md`
- `docs/polityka-prywatnosci.md`
