# SmartRecipe — Raport z wyników testów

---

## 1. Zakres i rodzaje testów

Testujemy wszystkie główne funkcje SmartRecipe opisane w dokumentacji projektu: zarządzanie przepisami, spiżarnią, sugestiami posiłków, listą zakupów i importem przepisów z zewnętrznej bazy. 

Dodatkowo sprawdziliśmy, czy dane jednego użytkownika nie są widoczne dla innego oraz czy sugestie ładują się wystarczająco szybko.

Zastosowaliśmy trzy poziomy testów wymagane przez prowadzącego (punkt 6) — każdy odpowiada na inne pytanie. Dodatkowo mamy test obciążeniowy RNF01 (wymaganie projektu, nie punkt 6).


| Poziom                   | Narzędzie                         | Co sprawdza                                                                                                                | Przykład                                                           |
| ------------------------ | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Jednostkowe              | Jest (serwer), Vitest (interfejs) | Czy pojedyncza funkcja lub komponent działa poprawnie w izolacji                                                           | Przelicznik g→kg; filtr statusu przepisu w UI                      |
| Modułowe                 | Jest (serwer, mock bazy)          | Czy współpracujące moduły serwera dają poprawny wynik bez pełnej aplikacji                                                 | Sugestie + normalizacja jednostek; lista zakupów + spiżarnia       |
| Funkcjonalne (przez API) | Supertest + baza PostgreSQL       | Czy serwer odpowiada prawidłowo na żądania tak, jak robi to przeglądarka użytkownika — od rejestracji po pobranie sugestii | Utworzenie przepisu, dodanie go do spiżarni, odczyt listy sugestii |
| Obciążeniowe (RNF01)     | k6                                | Czy system nadąża, gdy wielu użytkowników jednocześnie prosi o sugestie                                                    | 10 użytkowników przez 30 sekund odpytuje ten sam endpoint          |


Pełny plan testów i mapowanie na wymagania z dokumentacji: [PLAN_TESTOW.md](PLAN_TESTOW.md).

---

## 2. Wyniki

Wyniki zostały ponownie zweryfikowane niezależnie (Jest + Vitest + E2E). Każdy test automatyczny zakończył się powodzeniem.


| Warstwa                                | Testów  | Wynik          |
| -------------------------------------- | ------- | -------------- |
| Serwer — testy jednostkowe             | 15      | 15/15 OK       |
| Serwer — testy modułowe                | 120     | 120/120 OK     |
| Serwer — testy funkcjonalne (API + DB) | 10      | 10/10 OK       |
| Interfejs — testy jednostkowe          | 138     | 138/138 OK     |
| **Razem**                              | **283** | **283/283 OK** |


Polecenia weryfikacyjne:   
`cd smartrecipe/backend && pnpm test` (135)  
`pnpm test:e2e` (10)  
`cd ../frontend && pnpm test` (138)

W praktyce oznacza to, że po każdej większej zmianie w kodzie możemy jednym poleceniem sprawdzić setki scenariuszy — zamiast ręcznie przeklikiwać całą aplikację od nowa. Instrukcja uruchomienia: [smartrecipe/test/README.md](smartrecipe/test/README.md).

---

## 3. Pokrycie kodu

Pokrycie kodu mówi, jaki procent programu jest objęty testami automatycznymi.   
Im wyższe — tym więcej logiki weryfikujemy bez ręcznej pracy.


| Warstwa              | Linie kodu objęte testami | Minimalny próg (ustalony przez zespół) | Status |
| -------------------- | ------------------------- | -------------------------------------- | ------ |
| Serwer (backend)     | 67,3%                     | 45%                                    | OK     |
| Interfejs (frontend) | 80,5% (linie)             | 55%                                    | OK     |


Najlepiej pokryte są moduły odpowiedzialne za logikę biznesową: przepisy, sugestie, lista zakupów, spiżarnia i kaloryczność składników.

Szczegółowe raporty HTML: `backend/coverage/lcov-report/` · `frontend/coverage/`

---

## 4. Testy przez API, wydajność i bezpieczeństwo

### Testy funkcjonalne serwera (10 testów)

Testy uruchamiają działającą aplikację serwerową i wysyłają żądania tak, jak robi to frontend — z tokenem logowania.   

Sprawdzają m.in.:

- tworzenie, edycję i usuwanie przepisów oraz poprawność statusów (szkic → aktywny → archiwum),
- dodawanie składników do spiżarni i generowanie sugestii na tej podstawie,
- to, że użytkownik A nie może podejrzeć ani zmienić przepisu użytkownika B,
- to, że hasła w bazie są zapisane w formie zaszyfrowanej, a nie jako zwykły tekst,
- to, że bez zalogowania nie można pobrać chronionych danych.

### Test wydajności (k6)

Narzędzie k6 symuluje 10 użytkowników, którzy przez 30 sekund proszą serwer o listę sugestii przepisów.  
W dokumentacji wymagania zapisaliśmy, że odpowiedź powinna zająć mniej niż 2 sekundy.


| Metryka                                    | Co oznacza                                        | Wynik | Limit      | Status |
| ------------------------------------------ | ------------------------------------------------- | ----- | ---------- | ------ |
| Czas odpowiedzi (najwolniejsze 5% zapytań) | Jak długo czeka „najgorzej traktowany” użytkownik | 12 ms | 2000 ms    | OK     |
| Błędy HTTP                                 | Ile zapytań zakończyło się niepowodzeniem         | 0%    | poniżej 5% | OK     |


Wynik jest więc znacznie lepszy niż wymagany próg. 

Test uruchamiamy lokalnie przy działającym serwerze — szczegóły przebiegu: [test/load/last-run-summary.md](smartrecipe/test/load/last-run-summary.md).

---

## 5. Automatyzacja i poprawki

### Automatyzacja

Przy każdym wysłaniu zmian do repozytorium (pull request na gałąź `main`) GitHub Actions automatycznie:

- sprawdza poprawność stylu kodu,
- uruchamia wszystkie testy serwera — łącznie z testami na bazie danych,
- uruchamia testy interfejsu i weryfikuje, czy pokrycie kodu nie spadło poniżej ustalonych progów.

Dzięki temu błąd wykrywamy zanim zmiana trafi do głównej wersji projektu.

### Poprawki znalezione dzięki testom


| Problem                                                                     | Co zrobiliśmy                                                                                                    |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Po dodaniu składników do spiżarni lista sugestii nie aktualizowała się sama | Naprawiliśmy mechanizm odświeżania danych — użytkownik widzi aktualne sugestie bez ręcznego przeładowania strony |
| Aplikacja mogła się zawiesić, gdy serwer zwrócił nieoczekiwaną odpowiedź    | Dodaliśmy sprawdzenie, czy odpowiedź jest listą — zamiast pustego ekranu pojawia się czytelny błąd               |
| Brakowało testów dla spiżarni, katalogu składników, użytkowników i importu  | Dopisaliśmy brakujące testy jednostkowe                                                                          |
| Testy serwera z bazą danych nie były w automatycznej kontroli na GitHubie   | Rozszerzyliśmy pipeline o bazę PostgreSQL i pełny zestaw testów                                                  |


