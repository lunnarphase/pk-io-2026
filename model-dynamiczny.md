# Identyfikacja przypadków użycia, analiza problemu i specyfikacja wymagań - SmartRecipe

Dokument uzupełnia [model opisowy i diagramy C4](README.md) oraz [model statyczny](model-statyczny.md) o identyfikację aktorów i przypadków użycia, analizę problemu, modele interakcji oraz weryfikowalną specyfikację wymagań.

---

## 1. Identyfikacja aktorów

| ID  | Aktor                     | Typ                 | Opis                                                                                                                                                         |
| --- | ------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A01 | Użytkownik                | Główny, ludzki      | Domowy kucharz. Rejestruje się i loguje w systemie. Zarządza własną bazą przepisów, spiżarnią i listą zakupów. Korzysta z propozycji posiłków.               |
| A02 | Zewnętrzne API – żywność  | Drugorzędny, system | Serwis REST USDA FoodData Central - kalorie na 100 g i porcje (`gramsPerPiece`). Wywoływany po tłumaczeniu nazwy (A04).                                      |
| A03 | Zewnętrzne API – przepisy | Drugorzędny, system | Serwis REST umożliwiający wyszukiwanie przepisów spoza bazy użytkownika (np. Spoonacular). Inicjowany pośrednio przez użytkownika przez UI.                  |
| A04 | Zewnętrzne API – DeepL    | Drugorzędny, system | Serwis REST tłumaczący polskie nazwy składników na angielski przed zapytaniem do USDA FDC. Inicjowany przez system (moduł kaloryki / wzbogacania składnika). |

> Na tym etapie system nie przewiduje ról administracyjnych ani współdzielenia przepisów między użytkownikami. Każdy użytkownik operuje wyłącznie na własnych danych.

---

## 2. Przypadki użycia

### 2.1 Diagram przypadków użycia

```mermaid
graph LR
    User(("A01\nUżytkownik"))
    NutAPI(["A02\nZewnętrzne API\nŻywność"])
    RecAPI(["A03\nZewnętrzne API\nPrzepisy"])
    DeeplAPI(["A04\nDeepL API\nTłumaczenie"])

    subgraph sys["System SmartRecipe"]
        UC01("UC01\nZarządzanie przepisami")
        UC02("UC02\nZarządzanie spiżarnią")
        UC03("UC03\nGenerowanie propozycji\nposiłków")
        UC04("UC04\nZarządzanie listą\nzakupów")
        UC05("UC05\nWyszukiwanie\nprzepisów zewnętrznych")
    end

    User --- UC01
    User --- UC02
    User --- UC03
    User --- UC04
    User --- UC05
    UC01 -. "<<uses>>" .-> DeeplAPI
    UC01 -. "<<uses>>" .-> NutAPI
    UC03 -. "<<uses>>" .-> NutAPI
    UC05 -. "<<uses>>" .-> RecAPI
    UC04 -. "<<extend>>" .-> UC02
```

### 2.2 Lista przypadków użycia

| ID   | Nazwa                               | Aktor główny          | Priorytet |
| ---- | ----------------------------------- | --------------------- | --------- |
| UC01 | Zarządzanie przepisami              | Użytkownik (A01)      | Wysoki    |
| UC02 | Zarządzanie spiżarnią               | Użytkownik (A01)      | Wysoki    |
| UC03 | Generowanie propozycji posiłków     | Użytkownik (A01), A02 | Wysoki    |
| UC04 | Zarządzanie listą zakupów           | Użytkownik (A01)      | Wysoki    |
| UC05 | Wyszukiwanie przepisów zewnętrznych | Użytkownik (A01), A03 | Średni    |

### 2.3 Specyfikacja przypadków użycia

#### UC01: Zarządzanie przepisami

| Pole                         | Opis                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**                       | UC01                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| **Nazwa**                    | Zarządzanie przepisami                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **Aktor główny**             | Użytkownik (A01)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| **Cel**                      | Stworzenie i utrzymanie własnej bazy przepisów kulinarnych                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| **Warunki wstępne**          | Użytkownik jest zalogowany                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| **Scenariusz główny**        | 1. Użytkownik tworzy szkic przepisu (tytuł, metadane: liczba porcji, dieta, kuchnia, kaloryczność).<br/>2. Definiuje skład – składniki, ilości i jednostki.<br/>3. Publikuje przepis – status zmienia się na `ACTIVE`.<br/>4. Filtruje przepisy według diety, kuchni lub kaloryczności.<br/>5. Archiwizuje lub usuwa wybrany przepis.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| **Scenariusze alternatywne** | 2a. Składnik nieznany -> system proponuje dodanie nowego wpisu do katalogu.<br/>2b. Użytkownik pobiera kalorykę składnika - system tłumaczy nazwę PL→EN (DeepL, A04), wyszukuje w USDA (A02), zapisuje `kcalPer100g` i opcjonalnie `gramsPerPiece`.<br/>2c. W szkicu użytkownik uruchamia szacowanie kcal - system sumuje składniki z `kcalPer100g` (i `gramsPerPiece` dla `szt`), dzieli przez `servings`, uzupełnia `estimatedKcalPerServing` (wartość do zapisania przez użytkownika).<br/>2d. Składnik bez kaloryki lub bez przeliczenia na gramy (np. łyżka) - pomijany w sumie; użytkownik dostaje podsumowanie pominiętych pozycji.<br/>2e. DeepL niedostępny lub brak klucza API - wyszukiwanie USDA po oryginalnej polskiej nazwie (gorsze trafienia).<br/>3a. Skład przepisu jest pusty -> system blokuje publikację z komunikatem walidacji.<br/>5a. Usuwany przepis jest powiązany z aktywną listą zakupów -> system ostrzega użytkownika przed usunięciem. |
| **Warunki końcowe**          | Przepis istnieje w systemie z odpowiednim statusem cyklu życia (`DRAFT`, `ACTIVE` lub `ARCHIVED`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |

#### UC02: Zarządzanie spiżarnią

| Pole                         | Opis                                                                                                                                                                                                                               |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**                       | UC02                                                                                                                                                                                                                               |
| **Nazwa**                    | Zarządzanie spiżarnią                                                                                                                                                                                                              |
| **Aktor główny**             | Użytkownik (A01)                                                                                                                                                                                                                   |
| **Cel**                      | Utrzymanie aktualnego stanu posiadanych składników                                                                                                                                                                                 |
| **Warunki wstępne**          | Użytkownik jest zalogowany                                                                                                                                                                                                         |
| **Scenariusz główny**        | 1. Użytkownik przegląda listę składników w spiżarni.<br/>2. Dodaje nową pozycję – wybiera składnik, ilość i jednostkę.<br/>3. Koryguje ilość istniejącej pozycji.<br/>4. Usuwa pozycję, gdy składnik został zużyty.                |
| **Scenariusze alternatywne** | 2a. Składnik nie istnieje w katalogu -> system tworzy go lub proponuje dopasowanie do istniejącego.<br/>4a. Pozycja spiżarni jest powiązana z przepisem -> usunięcie nie narusza danych przepisu, zmienia wyłącznie stan spiżarni. |
| **Warunki końcowe**          | Spiżarnia odzwierciedla aktualny, zaktualizowany stan posiadanych składników.                                                                                                                                                      |

#### UC03: Generowanie propozycji posiłków

| Pole                         | Opis                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**                       | UC03                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **Nazwa**                    | Generowanie propozycji posiłków                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **Aktor główny**             | Użytkownik (A01)                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| **Aktorzy drugorzędni**      | Zewnętrzne API – żywność (A02)                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| **Cel**                      | Automatyczne dopasowanie przepisów do składników dostępnych w spiżarni                                                                                                                                                                                                                                                                                                                                                                                                              |
| **Warunki wstępne**          | Użytkownik jest zalogowany;<br/>spiżarnia zawiera co najmniej jeden składnik;<br/>użytkownik posiada co najmniej jeden opublikowany przepis (`ACTIVE`)                                                                                                                                                                                                                                                                                                                              |
| **Scenariusz główny**        | 1. Użytkownik wybiera opcję „Generuj propozycje".<br/>2. System pobiera stan spiżarni użytkownika (`PantryItem`).<br/>3. System pobiera wszystkie `ACTIVE` przepisy użytkownika wraz ze składem (`RecipeIngredient`).<br/>4. Dla każdego przepisu system normalizuje jednostki i sprawdza dostępność wszystkich wymaganych składników.<br/>5. System zwraca listę przepisów możliwych do przygotowania.<br/>6. Użytkownik opcjonalnie filtruje wyniki według diety lub typu kuchni. |
| **Scenariusze alternatywne** | 4a. Jednostki różnią się (np. g vs kg) -> system normalizuje przed porównaniem.<br/>5a. Żaden przepis nie pasuje -> system informuje o braku wyników i sugeruje uzupełnienie spiżarni.<br/>5b. Przepisy, do których brakuje ≤ 2 składników -> system wyświetla je jako „prawie gotowe".                                                                                                                                                                                             |
| **Warunki końcowe**          | Użytkownik widzi listę przepisów możliwych do przygotowania wyłącznie z posiadanych składników.                                                                                                                                                                                                                                                                                                                                                                                     |

#### UC04: Zarządzanie listą zakupów

| Pole                         | Opis                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**                       | UC04                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| **Nazwa**                    | Zarządzanie listą zakupów                                                                                                                                                                                                                                                                                                                                                                                                                          |
| **Aktor główny**             | Użytkownik (A01)                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| **Cel**                      | Planowanie zakupów spożywczych – automatyczne lub ręczne uzupełnienie listy na podstawie wybranych przepisów i stanu spiżarni                                                                                                                                                                                                                                                                                                                      |
| **Warunki wstępne**          | Użytkownik jest zalogowany                                                                                                                                                                                                                                                                                                                                                                                                                         |
| **Scenariusz główny**        | 1. Użytkownik otwiera aktywną listę zakupów (tworzona automatycznie, jeśli nie istnieje).<br/>2. Wybiera przepisy do przygotowania.<br/>3. System oblicza brakujące składniki: skład wybranych przepisów minus stan spiżarni.<br/>4. Braki trafiają na listę jako pozycje `ShoppingListItem`.<br/>5. Użytkownik przegląda listę i opcjonalnie dodaje ręcznie dodatkowe pozycje.<br/>6. Użytkownik oznacza kupione pozycje jako `purchased = true`. |
| **Scenariusze alternatywne** | 3a. Składnik z wielu przepisów pokrywa się -> ilości są sumowane w jednej pozycji.<br/>6a. Wszystkie pozycje oznaczone jako kupione -> system proponuje przeniesienie ich do spiżarni.                                                                                                                                                                                                                                                             |
| **Warunki końcowe**          | Lista zakupów zawiera pozycje ze skalkulowanymi brakami; część lub wszystkie są oznaczone jako zakupione.                                                                                                                                                                                                                                                                                                                                          |

#### UC05: Wyszukiwanie przepisów zewnętrznych

| Pole                         | Opis                                                                                                                                                                                                                                     |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**                       | UC05                                                                                                                                                                                                                                     |
| **Nazwa**                    | Wyszukiwanie przepisów zewnętrznych                                                                                                                                                                                                      |
| **Aktor główny**             | Użytkownik (A01)                                                                                                                                                                                                                         |
| **Aktorzy drugorzędni**      | Zewnętrzne API – przepisy (A03)                                                                                                                                                                                                          |
| **Cel**                      | Poszerzenie własnej bazy przepisów o wyniki z zewnętrznego serwisu                                                                                                                                                                       |
| **Warunki wstępne**          | Użytkownik jest zalogowany;<br/>zewnętrzne API przepisów jest dostępne                                                                                                                                                                   |
| **Scenariusz główny**        | 1. Użytkownik wpisuje frazę wyszukiwania.<br/>2. System wysyła zapytanie do zewnętrznego API przepisów (A03).<br/>3. Wyniki są wyświetlane użytkownikowi.<br/>4. Użytkownik wybiera przepis i importuje go do własnej bazy jako `DRAFT`. |
| **Scenariusze alternatywne** | 2a. Brak odpowiedzi API (timeout / błąd) -> system wyświetla komunikat o niedostępności, funkcja niedostępna.<br/>4a. Importowany przepis zawiera nieznane składniki -> system tworzy dla nich nowe wpisy w katalogu składników.         |
| **Warunki końcowe**          | Wybrany przepis jest zapisany w bazie użytkownika ze statusem `DRAFT`, gotowy do edycji i publikacji.                                                                                                                                    |

---

## 3. Diagramy czynności (wybranych UC)

### 3.1 Diagram czynności: UC03 – Generowanie propozycji posiłków

```mermaid
flowchart TD
    Start([Start]) --> A["Użytkownik wybiera\n'Generuj propozycje'"]
    A --> B[Pobierz PantryItem\ndla użytkownika]
    B --> C{Spiżarnia\nniepusta?}
    C -- Nie --> Err1[Komunikat:\nuzupełnij spiżarnię]
    Err1 --> End([Koniec])
    C -- Tak --> D[Pobierz ACTIVE przepisy\nużytkownika z RecipeIngredient]
    D --> E{Przynajmniej\n1 przepis?}
    E -- Nie --> Err2[Komunikat:\ndodaj przepisy]
    Err2 --> End
    E -- Tak --> H[Inicjalizuj pustą\nlistę wyników]
    H --> I[Pobierz następny przepis]
    I --> J[Normalizuj jednostki\nczłonów RecipeIngredient]
    J --> K[Porównaj skład przepisu\nze stanem spiżarni]
    K --> L{Wszystkie wymagane\nskładniki dostępne?}
    L -- Tak --> M[Dodaj przepis do\nlisty wyników]
    L -- Nie --> N{Brakuje\n≤ 2 składników?}
    N -- Tak --> O["Dodaj do listy\n'prawie gotowe'"]
    N -- Nie --> P[Pomiń przepis]
    M --> Q{Kolejny\nprzepis?}
    O --> Q
    P --> Q
    Q -- Tak --> I
    Q -- Nie --> R{Lista wyników\nniepusta?}
    R -- Nie --> Err3[Komunikat:\nbrak pasujących przepisów]
    Err3 --> End
    R -- Tak --> T[Wyświetl propozycje\nposiłków użytkownikowi]
    T --> U[Użytkownik opcjonalnie\nfiltruje wyniki]
    U --> End
```

### 3.2 Diagram czynności: UC04 – Zarządzanie listą zakupów

```mermaid
flowchart TD
    Start([Start]) --> A[Użytkownik otwiera\nlistę zakupów]
    A --> B{Aktywna ShoppingList\nistnieje?}
    B -- Nie --> C[Utwórz nową\naktywną ShoppingList]
    C --> D[Wyświetl pustą\nlistę zakupów]
    B -- Tak --> D2[Wyświetl bieżącą\nlistę zakupów]
    D --> E[Użytkownik wybiera\nprzepisy do przygotowania]
    D2 --> E
    E --> F[Pobierz RecipeIngredient\ndla wybranych przepisów]
    F --> G[Pobierz PantryItem\nużytkownika]
    G --> H[Oblicz brakujące składniki:\nskład przepisów − spiżarnia]
    H --> I{Kolejny brakujący\nskładnik?}
    I -- Nie --> M[Wyświetl zaktualizowaną\nlistę zakupów]
    I -- Tak --> J{Pozycja już\nna liście?}
    J -- Tak --> K[Zsumuj wymagane\nilości]
    J -- Nie --> L[Dodaj nowy\nShoppingListItem]
    K --> I
    L --> I
    M --> N[Użytkownik przegląda\ni opcjonalnie edytuje listę]
    N --> O{Użytkownik oznacza\npozycję jako kupioną?}
    O -- Nie --> End([Koniec])
    O -- Tak --> P["Ustaw purchased = true\ndla pozycji"]
    P --> Q{Wszystkie pozycje\noznaczone jako kupione?}
    Q -- Nie --> O
    Q -- Tak --> R[Zaproponuj przeniesienie\nkupionych pozycji do spiżarni]
    R --> End
```

---

## 4. Analiza problemu

### 4.1 Weryfikacja spójności modelu

Poniższa tabela weryfikuje zgodność przypadków użycia z elementami modelu statycznego i sprawdza, czy każdy UC ma swój odpowiednik w serwisach i encjach domenowych.

| Przypadek użycia             | Kluczowe encje (model statyczny)                         | Kluczowy serwis                    | Spójność |
| ---------------------------- | -------------------------------------------------------- | ---------------------------------- | -------- |
| UC01: Zarządzanie przepisami | `Recipe`, `RecipeIngredient`, `Ingredient`               | `RecipeManagementService`          | ✓        |
| UC02: Zarządzanie spiżarnią  | `PantryItem`, `Ingredient`                               | `PantryService`                    | ✓        |
| UC03: Generowanie propozycji | `Recipe`, `PantryItem`, `RecipeIngredient`, `Ingredient` | `MealSuggestionService`            | ✓        |
| UC04: Lista zakupów          | `ShoppingList`, `ShoppingListItem`, `PantryItem`         | `ShoppingListService`              | ✓        |
| UC05: Przepisy zewnętrzne    | `Recipe`, `Ingredient`                                   | `RecipeManagementService` (import) | ✓        |

### 4.2 Analiza przyczyn problemu

**Problem centralny:** użytkownik nie wie co ugotować z posiadanych składników i w efekcie marnuje żywność lub ponosi zbędne koszty zakupów.

Główne przyczyny i sposób ich adresowania przez system:

| Przyczyna                                                                   | Adresujący element systemu                                   |
| --------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Brak jednego miejsca z przepisami i stanem spiżarni                         | `Recipe` + `PantryItem` w jednej domenie; UC01 + UC02        |
| Ręczne przeszukiwanie internetu pod kątem dostępnych składników jest żmudne | `MealSuggestionService.suggestRecipes` -> UC03               |
| Lista zakupów tworzona ręcznie, bez wiedzy o tym co już w domu              | `ShoppingListService.fillMissingFromRecipes` -> UC04         |
| Brak filtrów diety i kuchni przy wyborze przepisów                          | Atrybuty `DietType`, `CuisineType` na `Recipe` -> UC01 filtr |
| Trudność w odkryciu nowych przepisów pasujących do diety                    | Integracja z zewnętrznym API przepisów -> UC05               |

### 4.3 Zidentyfikowane ryzyka i ograniczenia

| ID  | Ryzyko / ograniczenie                                                         | Wpływ  | Proponowana mitigacja                                                                                  |
| --- | ----------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------ |
| R01 | Różnorodność jednostek miar (g, ml, łyżki, sztuki) utrudnia porównanie ilości | Wysoki | Warstwa normalizacji jednostek w `MealSuggestionService` i `ShoppingListService`                       |
| R02 | Różne nazwy tych samych składników (np. „cukier" vs „cukier biały")           | Wysoki | Normalizacja katalogu składników; pole `externalFoodId` jako kanoniczny klucz                          |
| R03 | Niedostępność zewnętrznych API (DeepL, żywność, przepisy)                     | Średni | Cache tłumaczeń i odpowiedzi USDA; bez DeepL - fallback na polską nazwę; bez USDA - brak auto-kaloryki |
| R04 | Brak mechanizmu współdzielenia przepisów między użytkownikami                 | Niski  | Poza zakresem MVP; identyfikacja dla przyszłych iteracji                                               |
| R05 | Brak uwierzytelniania i autoryzacji w opisie MVP                              | Wysoki | Wymagane wdrożenie przed wersją produkcyjną (RF14 jako wymaganie bezpieczeństwa)                       |

---

## 5. Modele interakcji (diagramy sekwencji)

### 5.1 Diagram sekwencji: UC03 – Generowanie propozycji posiłków

```mermaid
sequenceDiagram
    actor U as Użytkownik
    participant SPA as Aplikacja webowa
    participant API as Backend API
    participant MSS as MealSuggestionService
    participant DB as Baza danych
    participant NutAPI as Zewnętrzne API Żywność

    U->>SPA: Kliknij "Generuj propozycje"
    SPA->>API: GET /suggestions
    API->>MSS: suggestRecipes(userId)
    MSS->>DB: pobierz PantryItem dla userId
    DB-->>MSS: lista PantryItem
    MSS->>DB: pobierz ACTIVE Recipe z RecipeIngredient dla userId
    DB-->>MSS: lista Recipe (ze składem)
    loop dla każdego Recipe
        MSS->>MSS: normalizuj jednostki składników
        MSS->>MSS: porównaj skład z spiżarnią
    end
    alt składnik bez danych kalorycznych
        MSS->>NutAPI: GET /nutrition?foodId={externalFoodId}
        NutAPI-->>MSS: dane kaloryczne
        MSS->>DB: zapisz dane kaloryczne dla Ingredient
    end
    MSS-->>API: lista dopasowanych Recipe
    API-->>SPA: 200 OK { recipes: [...] }
    SPA-->>U: wyświetl listę propozycji posiłków
```

### 5.2 Diagram sekwencji: wzbogacanie składnika (DeepL + USDA)

Źródło: [diagrams/sequenceDiagrams/nutritionEnrich.mmd](diagrams/sequenceDiagrams/nutritionEnrich.mmd).

```mermaid
sequenceDiagram
    actor U as Użytkownik
    participant SPA as Aplikacja webowa
    participant API as Backend API
    participant NS as NutritionService
    participant DeepL as DeepL API
    participant USDA as USDA FDC API
    participant DB as Baza danych

    U->>SPA: Pobierz kalorykę / wyszukaj składnik
    SPA->>API: GET /nutrition/search?q=...
    API->>NS: searchFoods(query)
    NS->>DeepL: POST /translate (PL→EN)
    DeepL-->>NS: np. "wheat flour"
    NS->>USDA: GET /foods/search?q=...
    USDA-->>NS: lista FDC
    NS-->>API: wyniki (fdcId, kcal/100g)
    API-->>SPA: 200 OK
    U->>SPA: Zapisz / auto-enrich
    SPA->>API: POST /nutrition/enrich/:id
    API->>NS: enrichIngredient(id)
    NS->>USDA: GET /food/{fdcId}
    USDA-->>NS: kcal, foodPortions
    NS->>DB: zapisz kcalPer100g, gramsPerPiece, externalFoodId
    DB-->>NS: Ingredient
    NS-->>API: Ingredient
    API-->>SPA: 200 OK
```

### 5.3 Diagram sekwencji: UC04 – Wypełnienie listy zakupów z przepisów

```mermaid
sequenceDiagram
    actor U as Użytkownik
    participant SPA as Aplikacja webowa
    participant API as Backend API
    participant SLS as ShoppingListService
    participant DB as Baza danych

    U->>SPA: Wybierz przepisy i kliknij "Dodaj do listy zakupów"
    SPA->>API: POST /shopping-list/fill { recipeIds: [...] }
    API->>SLS: fillMissingFromRecipes(userId, recipeIds)
    SLS->>DB: getOrCreateActiveList(userId)
    DB-->>SLS: ShoppingList
    SLS->>DB: pobierz RecipeIngredient dla recipeIds
    DB-->>SLS: składniki wybranych przepisów z ilościami
    SLS->>DB: pobierz PantryItem dla userId
    DB-->>SLS: stan spiżarni
    loop dla każdego brakującego składnika
        SLS->>SLS: oblicz brakującą ilość
        SLS->>DB: upsert ShoppingListItem (zsumuj jeśli istnieje)
        DB-->>SLS: potwierdzenie
    end
    SLS-->>API: zaktualizowana ShoppingList z pozycjami
    API-->>SPA: 200 OK { shoppingList: {...} }
    SPA-->>U: wyświetl zaktualizowaną listę zakupów
```

---

## 6. Specyfikacja wymagań

### 6.1 Wymagania funkcjonalne

| ID   | Wymaganie                                                                                                                                                     | Priorytet   | Powiązany UC |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------------ |
| RF01 | System umożliwia tworzenie, edycję, publikowanie, archiwizowanie i usuwanie przepisów                                                                         | Must-have   | UC01         |
| RF02 | Przepis zawiera: tytuł, instrukcje, listę składników z ilościami i jednostkami, liczbę porcji, typ diety, typ kuchni, szacowaną kaloryczność (kcal na porcję) | Must-have   | UC01         |
| RF03 | Przepis przechodzi przez cykl życia: `DRAFT` -> `ACTIVE` ↔ `ARCHIVED`; niedozwolone przejścia są odrzucane                                                    | Must-have   | UC01         |
| RF04 | System umożliwia filtrowanie przepisów według diety, typu kuchni i zakresu kaloryczności                                                                      | Should-have | UC01         |
| RF05 | System umożliwia zarządzanie wirtualną spiżarnią (dodawanie, edycja ilości, usuwanie składników)                                                              | Must-have   | UC02         |
| RF06 | System generuje listę przepisów możliwych do przygotowania wyłącznie z dostępnych w spiżarni składników                                                       | Must-have   | UC03         |
| RF07 | Algorytm dopasowania przepisów uwzględnia normalizację jednostek miar (g/kg, ml/l, łyżki/łyżeczki)                                                            | Must-have   | UC03         |
| RF08 | System wyróżnia przepisy, do których brakuje co najwyżej 2 składników (sekcja „prawie gotowe")                                                                | Could-have  | UC03         |
| RF09 | System utrzymuje jedną aktywną listę zakupów per użytkownik, tworzoną automatycznie przy pierwszym otwarciu                                                   | Must-have   | UC04         |
| RF10 | System automatycznie oblicza brakujące składniki (skład wybranych przepisów minus stan spiżarni) i dodaje je do listy zakupów                                 | Must-have   | UC04         |
| RF11 | Pokrywające się składniki z wielu przepisów są scalane w jedną pozycję listy z sumowaną ilością                                                               | Must-have   | UC04         |
| RF12 | Użytkownik może ręcznie dodawać, edytować i usuwać pozycje z listy zakupów                                                                                    | Must-have   | UC04         |
| RF13 | Użytkownik może oznaczać pozycje listy zakupów jako zakupione (`purchased = true`)                                                                            | Must-have   | UC04         |
| RF14 | System umożliwia wyszukiwanie przepisów za pomocą zewnętrznego API i importowanie ich do bazy użytkownika jako `DRAFT`                                        | Should-have | UC05         |
| RF15 | System pobiera i cachuje dane kaloryczne składników z zewnętrznego API żywności (`kcalPer100g`, opcjonalnie `gramsPerPiece` z porcji FDC / serving)           | Should-have | UC01, UC03   |
| RF16 | W szkicu przepisu system może oszacować `estimatedKcalPerServing` na podstawie składu, liczby porcji i znormalizowanych jednostek (g, ml, szt z wagą z FDC)   | Could-have  | UC01         |
| RF17 | Przed wyszukiwaniem składnika w USDA system tłumaczy polską nazwę na angielski przez DeepL (A04); przy braku API - wyszukiwanie po nazwie polskiej            | Should-have | UC01         |

### 6.2 Wymagania niefunkcjonalne

| ID    | Wymaganie                                                                                     | Kategoria       | Miara / kryterium                                  |
| ----- | --------------------------------------------------------------------------------------------- | --------------- | -------------------------------------------------- |
| RNF01 | Czas odpowiedzi API dla generowania propozycji posiłków (UC03) < 2 s dla bazy ≤ 500 przepisów | Wydajność       | p95 < 2 s (test obciążeniowy)                      |
| RNF02 | Czas odpowiedzi pozostałych operacji CRUD < 500 ms                                            | Wydajność       | p95 < 500 ms                                       |
| RNF03 | System działa poprawnie bez dostępu do zewnętrznych API (graceful degradation)                | Niezawodność    | Dostępność core funkcji = 100% bez ext. API        |
| RNF04 | Dane użytkownika są izolowane – brak możliwości dostępu do danych innych użytkowników         | Bezpieczeństwo  | 0 naruszeń izolacji danych (test cross-user)       |
| RNF05 | Hasła użytkowników przechowywane w postaci hashu (bcrypt lub Argon2)                          | Bezpieczeństwo  | Brak plain-text haseł w bazie danych               |
| RNF06 | Interfejs webowy jest responsywny i działa poprawnie na urządzeniach mobilnych i desktopowych | Użyteczność     | Poprawne działanie na ekranach ≥ 320 px szerokości |
| RNF07 | Backend API udostępnia dokumentację zgodną ze standardem OpenAPI 3.x                          | Pielęgnowalność | Plik `openapi.yaml` aktualny z implementacją       |

### 6.3 Weryfikacja wymagań

| ID wymagania | Metoda weryfikacji                        | Kryterium akceptacji                                                                                  |
| ------------ | ----------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| RF01         | Testy funkcjonalne API (CRUD)             | Wszystkie operacje zwracają poprawne kody HTTP i dane; nieistniejący zasób -> 404                     |
| RF02         | Testy jednostkowe walidacji modelu        | Próba utworzenia przepisu bez wymaganych pól zwraca błąd walidacji (400)                              |
| RF03         | Testy stanów (state machine)              | Niedozwolone przejście stanu (np. `DRAFT` -> `ARCHIVED`) jest odrzucane z błędem 422                  |
| RF06         | Test integracyjny z zadanym stanem danych | Dla określonego stanu spiżarni i zestawu przepisów wynik dopasowania jest deterministyczny i poprawny |
| RF07         | Testy jednostkowe modułu normalizacji     | Przeliczniki g/kg, ml/l oraz jednostki miary dają poprawne wyniki numeryczne                          |
| RF10         | Test integracyjny listy zakupów           | Różnica skład–spiżarnia jest poprawna i zdeduplikowana (scalanie pokrywających się składników)        |
| RF11         | Test integracyjny scalania pozycji        | Dodanie tych samych składników z dwóch przepisów tworzy jedną pozycję z sumą ilości                   |
| RNF01        | Test obciążeniowy (k6 / JMeter)           | p95 < 2 s przy bazie 500 przepisów i 100 równoległych użytkownikach                                   |
| RNF04        | Test bezpieczeństwa (cross-user request)  | Żądanie do zasobu innego użytkownika zwraca 403 Forbidden                                             |
| RNF05        | Inspekcja schematu bazy danych            | Kolumna hasła zawiera wyłącznie hasze (długość ≥ 60 znaków, brak rozpoznawalnych wzorców plain-text)  |
