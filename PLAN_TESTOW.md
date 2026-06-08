# SmartRecipe — Plan testów systemu

---

## 1. Cel i zakres

**Cel testów** — zweryfikować, że prototyp SmartRecipe poprawnie realizuje zaplanowaną logikę biznesową: użytkownik może prowadzić własną bazę przepisów, uzupełniać wirtualną spiżarnię, otrzymywać dopasowane sugestie posiłków, generować listę zakupów oraz importować przepisy z zewnętrznej bazy. 

Testy mają wychwycić regresje przed prezentacją i udokumentować pokrycie kluczowych wymagań (RF/RNF) z [model-dynamiczny.md](model-dynamiczny.md).

**Zakres funkcjonalny** — pięć głównych przypadków użycia aplikacji:


| UC   | Obszar            | Co weryfikujemy testami                                                       |
| ---- | ----------------- | ----------------------------------------------------------------------------- |
| UC01 | Przepisy          | CRUD, walidacja pól, cykl życia (szkic → aktywny → archiwum), szacowanie kcal |
| UC02 | Spiżarnia         | Dodawanie i aktualizacja składników, dopasowanie ilości                       |
| UC03 | Sugestie          | Algorytm dopasowania przepisów do zawartości spiżarni, normalizacja jednostek |
| UC04 | Lista zakupów     | Wyliczanie braków, scalanie pozycji z wielu przepisów                         |
| UC05 | Import zewnętrzny | Wyszukiwanie i import przepisu; zachowanie przy niedostępnym API              |


Poza logiką domenową sprawdzamy też **bezpieczeństwo** (izolacja danych między użytkownikami, hash haseł — RNF04, RNF05) oraz **wydajność sugestii** (RNF01 — test k6).

**Warstwy testów** — 283 zautomatyzowane scenariusze w trzech poziomach:

1. **Jednostkowe (153)** — pojedyncze funkcje i komponenty w izolacji: przeliczniki jednostek, ranking USDA, filtry przepisów i sugestii, warstwa `api/` w frontendzie.   
Backend: 15 testów w plikach poza `*.service.spec.ts`; frontend: 138 testów (Vitest).
2. **Modułowe (120)** — współpraca serwisów NestJS z mockowaną bazą (`*.service.spec.ts`):   
np. sugestie na podstawie spiżarni, lista zakupów z brakującymi składnikami, logowanie i szyfrowanie haseł.
3. **Funkcjonalne (10)** — pełne żądania HTTP na działającym serwerze z PostgreSQL (Supertest):   
rejestracja, CRUD przepisów, spiżarnia → sugestie, dostęp bez tokenu, izolacja między kontami.

Wyniki przebiegu: [RAPORT_TESTOW.md](RAPORT_TESTOW.md) (8.06.2026 — 283/283 OK).

**Automatyzacja** — przy każdym pull requeście GitHub Actions uruchamia lint i pełny zestaw testów backendu (w tym E2E z PostgreSQL) oraz testy frontendu z kontrolą pokrycia kodu.

---

## 2. Strategia testów


| Warstwa                 | Narzędzie                     | Co testujemy                                       | Gdzie w repo                   |
| ----------------------- | ----------------------------- | -------------------------------------------------- | ------------------------------ |
| Jednostkowe — serwer    | Jest                          | Logika modułów: przepisy, spiżarnia, sugestie itd. | `backend/src/**/*.spec.ts`     |
| Modułowe — serwer       | Jest (z symulowaną bazą)      | Współpraca modułów bez prawdziwej bazy danych      | `*.service.spec.ts`            |
| Funkcjonalne — serwer   | Jest + Supertest + PostgreSQL | Pełne żądania HTTP: rejestracja, CRUD, sugestie    | `backend/test/*.e2e-spec.ts`   |
| Jednostkowe — interfejs | Vitest                        | Logika widoków, filtry, wywołania API              | `frontend/src/**/*.test.ts(x)` |
| Obciążeniowe            | k6                            | Czas odpowiedzi sugestii pod obciążeniem           | `smartrecipe/test/load/`       |
| Automatyzacja           | GitHub Actions                | Lint i testy przy pull requeście                   | `.github/workflows/`           |


---

## 3. Testy jednostkowe

### 3.1 Serwer (backend)


| Moduł               | Plik testowy                                                                                                                                                | Co weryfikuje                                           |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Logowanie           | `auth.service.spec.ts`                                                                                                                                      | Rejestracja, logowanie, szyfrowanie haseł               |
| Użytkownicy         | `users.service.spec.ts`                                                                                                                                     | Tworzenie konta, blokada duplikatu e-mail               |
| Przepisy            | `recipes.service.spec.ts`                                                                                                                                   | Tworzenie, edycja, usuwanie, cykl życia, właściciel     |
| Kaloryczność        | `recipe-kcal-estimator.spec.ts`                                                                                                                             | Szacowanie kcal z listy składników                      |
| Spiżarnia           | `pantry.service.spec.ts`                                                                                                                                    | Dodawanie składników, dopasowanie ilości                |
| Sugestie            | `suggestions.service.spec.ts`                                                                                                                               | Propozycje dań na podstawie spiżarni                    |
| Lista zakupów       | `shopping-list.service.spec.ts`                                                                                                                             | Braki, scalanie pozycji z wielu przepisów               |
| Składniki           | `ingredients.service.spec.ts`                                                                                                                               | Katalog składników                                      |
| Import zewnętrzny   | `external.service.spec.ts`                                                                                                                                  | Wyszukiwanie i import; zachowanie przy braku klucza API |
| Kaloryczność (USDA) | `nutrition.service.spec.ts`, `deepl-translation.service.spec.ts`, `usda-hit-ranking.spec.ts`, `usda-portion-grams.spec.ts`, `ingredient-usda-query.spec.ts` | Pobieranie danych żywieniowych, tłumaczenie nazw        |
| Jednostki miar      | `unit-normalization.service.spec.ts`                                                                                                                        | Przeliczanie gramów, mililitrów, łyżek                  |
| Aplikacja (root)    | `app.controller.spec.ts`                                                                                                                                    | Endpoint główny                                         |


### 3.2 Interfejs (frontend)


| Obszar                     | Co weryfikuje                                                           |
| -------------------------- | ----------------------------------------------------------------------- |
| Warstwa API (`api/`)       | Czy frontend poprawnie wysyła żądania i interpretuje odpowiedzi serwera |
| Logika pomocnicza (`lib/`) | Filtry, normalizacja składników, odświeżanie cache                      |
| Moduł przepisów            | Cykl życia, filtry, szacowanie kcal                                     |
| Moduł sugestii             | Zakładki, filtry diet i kuchni                                          |
| Moduł listy zakupów        | Uzupełnianie listy z wybranych przepisów                                |
| Hooki i store              | Logowanie, opóźnienie wyszukiwania, przewijanie list                    |


**Uruchomienie:** `cd smartrecipe/frontend && pnpm test`

**Ekrany nieobjęte automatycznym pokryciem interfejsu:**   
formularze logowania i rejestracji oraz pełne widoki edycji przepisu testujemy inaczej — logika pod spodem jest pokryta testami jednostkowymi interfejsu i testami serwera przez API; sam wygląd i przejście przez formularz sprawdzamy ręcznie podczas demonstracji aplikacji

---

## 4. Testy modułowe

Testy modułowe sprawdzają współpracę kilku elementów serwera bez uruchamiania pełnej aplikacji.   
Baza danych jest symulowana — test szybki i powtarzalny.

**Pliki:** `backend/src/**/*.service.spec.ts` (11 plików, 120 przypadków testowych w zestawie Jest).

Przykłady:

- moduł przepisów + moduł spiżarni → czy poprawnie liczy brakujące składniki,
- moduł listy zakupów + moduł spiżarni → czy poprawnie wylicza, co trzeba dokupić,
- moduł sugestii + normalizacja jednostek → czy porównuje gramy z kilogramami,
- moduł kaloryczności + tłumaczenie nazw → czy wyszukuje składnik w bazie USDA po polskiej nazwie.

Kryterium sukcesu: dla tego samego stanu danych wejściowych wynik jest zawsze identyczny.

---

## 5. Testy funkcjonalne (serwer + baza danych)

Wymagają działającej bazy PostgreSQL (`docker compose up -d` w folderze `smartrecipe`).

Test uruchamia prawdziwy serwer i wysyła żądania HTTP — tak jak robi to aplikacja w przeglądarce.


| Plik                              | Scenariusz                                                                                            |
| --------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `recipes-api.e2e-spec.ts`         | Tworzenie, odczyt, edycja i usuwanie przepisu; odrzucenie błędnych danych; przejścia między statusami |
| `pantry-suggestions.e2e-spec.ts`  | Dodanie składników do spiżarni; sprawdzenie, czy sugestie zwracają właściwy przepis                   |
| `cross-user-security.e2e-spec.ts` | Użytkownik B nie widzi danych użytkownika A; hasła zaszyfrowane w bazie                               |
| `app.e2e-spec.ts`                 | Brak dostępu do chronionych danych bez logowania                                                      |


**Uruchomienie:** `cd smartrecipe/backend && pnpm test:e2e`

---

## 6. Testy niefunkcjonalne


| Wymaganie                 | Co sprawdzamy                                     | Narzędzie                       | Kryterium                         |
| ------------------------- | ------------------------------------------------- | ------------------------------- | --------------------------------- |
| RNF01 — szybkość sugestii | Czas odpowiedzi przy wielu użytkownikach          | k6                              | Odpowiedź poniżej 2 s             |
| RNF04 — izolacja danych   | Użytkownik nie widzi cudzych przepisów i spiżarni | Testy przez API                 | Odmowa dostępu (kod 403)          |
| RNF05 — hasła             | Hasła nie są zapisane jako zwykły tekst           | Test przez API + inspekcja bazy | Hash bcrypt w tabeli użytkowników |


---

## 7. Automatyzacja (GitHub Actions)


| Workflow          | Kiedy się uruchamia              | Co robi                                                                           |
| ----------------- | -------------------------------- | --------------------------------------------------------------------------------- |
| `backend-ci.yml`  | Zmiana w `smartrecipe/backend/`  | Sprawdza styl kodu, uruchamia testy jednostkowe z pokryciem i testy z bazą danych |
| `frontend-ci.yml` | Zmiana w `smartrecipe/frontend/` | Sprawdza styl kodu, uruchamia testy interfejsu z kontrolą minimalnego pokrycia    |


Progi pokrycia w konfiguracji (wymuszane przez `pnpm test:cov` w CI — nie wynikają z programu zajęć, tylko z ustawień projektu):

- **Interfejs:** `frontend/vitest.config.ts` — co najmniej 55% linii (obecnie ~80%)
- **Serwer:** `backend/package.json` → `coverageThreshold` — co najmniej 45% linii (obecnie ~67%)

---

## 8. Mapowanie wymagań na testy


| Wymaganie | Opis                                             | Sposób weryfikacji            | Status |
| --------- | ------------------------------------------------ | ----------------------------- | ------ |
| RF01      | CRUD przepisów                                   | Testy przez API               | OK     |
| RF02      | Walidacja pól przepisu                           | Testy przez API + jednostkowe | OK     |
| RF03      | Cykl życia przepisu (szkic / aktywny / archiwum) | Jednostkowe + przez API       | OK     |
| RF05      | Zarządzanie spiżarnią                            | Jednostkowe + przez API       | OK     |
| RF06      | Sugestie z spiżarni                              | Jednostkowe + przez API       | OK     |
| RF07      | Normalizacja jednostek (g, kg, ml…)              | Jednostkowe                   | OK     |
| RF10–RF11 | Lista zakupów, scalanie pozycji                  | Jednostkowe                   | OK     |
| RF14      | Import przepisów z zewnętrznej bazy              | Jednostkowe                   | OK     |
| RF17      | Tłumaczenie nazw przed wyszukiwaniem kalorii     | Jednostkowe                   | OK     |
| RNF01     | Szybkość sugestii                                | k6                            | OK     |
| RNF04     | Izolacja danych użytkowników                     | Testy przez API               | OK     |
| RNF05     | Szyfrowanie haseł                                | Jednostkowe + przez API       | OK     |


