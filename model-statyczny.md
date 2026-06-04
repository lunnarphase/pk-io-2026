# Model statyczny systemu SmartRecipe

Dokument uzupełnia [model opisowy i diagramy C4](docs.md) o artefakty UML: analizę statyczną, diagram klas, obiektów, pakietów, komponentów oraz wybrane diagramy stanu. Diagramy zostały napisane za pomocą MermaidJS.

---

## Analiza statyczna i powiązanie z modelem opisowym

Model statyczny precyzuje strukturę danych i podział odpowiedzialności między warstwami aplikacji tak, aby realizowały założenia z dokumentacji wstępnej. Poniższa tabela wiąże **fragmenty modelu opisowego** (wymagania słowne) z **elementami modelu statycznego** (klasy, pakiety, komponenty), które pojawiają się na diagramach w kolejnych podrozdziałach.

| Fragment modelu opisowego                                  | Odwzorowanie w modelu statycznym                                                                                                                                 |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Własne przepisy z listą składników i ilościami             | Klasy `Recipe`, `Ingredient`, `RecipeIngredient` (ilość, jednostka); powiązania jeden do wielu między przepisem a wierszami składowymi                           |
| Filtry: typ kuchni, kaloryczność, rodzaj diety             | Atrybuty / wartości w `Recipe` (np. `servings`, szacowana kaloryczność na porcję, `DietType`, `CuisineType`); reguły filtrowania w warstwie aplikacji            |
| Wirtualna spiżarnia i lista zakupów                        | `PantryItem` (co użytkownik ma w domu), `ShoppingList` oraz `ShoppingListItem` (braki i zakupy)                                                                  |
| Integracja: kalorie składników, wyszukiwarka przepisów     | Pakiet `infrastructure`: `DeeplTranslationClient` (PL→EN nazw składników), `NutritionApiClient` (USDA FDC: kcal/100 g, `gramsPerPiece`), `RecipeSearchApiClient` |
| Tłumaczenie przed wyszukiwaniem USDA                       | `NutritionService` wywołuje DeepL, potem USDA FDC po angielskiej frazie; bez klucza DeepL - fallback na polską nazwę                                             |
| Szacowanie kcal przepisu w szkicu                          | `RecipeManagementService.estimateKcal` - suma składników (g/ml/szt z `gramsPerPiece`) ÷ `servings` → `estimatedKcalPerServing` (tylko `DRAFT`)                   |
| Generowanie propozycji posiłków z posiadanych składników   | `MealSuggestionService` w warstwie `application` - operacja `suggestRecipes` na bazie przepisów użytkownika i stanu spiżarni                                     |
| Dodawanie i edycja własnych przepisów (szkic → publikacja) | `RecipeManagementService` - tworzenie szkicu, skład, metadane, publikacja / archiwizacja / usuwanie; użytkownik operuje przez API, nie bezpośrednio na encjach   |
| Lista zakupów i uzupełnianie jej wg wybranych przepisów    | `ShoppingListService` - aktywna lista, scalanie braków ze składu wielu `Recipe`, odjęcie tego co jest w `PantryItem`, oznaczanie zakupu                          |
| Prowadzenie wirtualnej spiżarni                            | `PantryService` - dodawanie / korekta ilości / usunięcie pozycji spiżarni powiązanych ze `Ingredient`                                                            |

Diagramy C4 (kontekst i kontenery) pokazują **wdrożenie**; niniejszy model statyczny koncentruje się na **logice domenowej, API i integracjach** zgodnie z typową architekturą warstwową. **Encje domenowe** nie są modyfikowane „z UI” wprost - warstwa aplikacji (**serwisy / przypadki użycia**) orkiestruje walidację, trwałość i reguły (np. tylko właściciel może edytować swój przepis).

---

## Diagram klas

**Cel:** przedstawić główne byty domenowe, powiązania liczności oraz **serwisy aplikacyjne**, które realizują przypadki użycia (propozycje posiłków, CRUD przepisów, lista zakupów w tym wypełnianie z przepisów, spiżarnia). Użytkownik korzysta z systemu przez API / UI; **trwała zmiana stanu** przechodzi przez te serwisy. Diagram celowo pomija szczegóły UI i mapowania ORM.

**Ograniczenia:** jeden agregat użytkownika na potrzeby opisu; w rzeczywistej aplikacji warto rozważyć osobny kontekst „konto / preferencje”.

```mermaid
classDiagram
    direction TB

    class User {
        +UUID id
        +String email
    }

    class Recipe {
        +UUID id
        +String title
        +String instructions
        +Integer servings
        +Integer estimatedKcalPerServing
        +RecipeLifecycleStatus lifecycleStatus
        +DietType dietType
        +CuisineType cuisineType
    }

    class Ingredient {
        +UUID id
        +String name
        +String externalFoodId
        +Decimal kcalPer100g
        +Decimal gramsPerPiece
    }

    class DeeplTranslationService {
        <<service>>
        +translatePlToEn(String text) String
    }

    class NutritionService {
        <<service>>
        +searchFoods(String query) List~Hit~
        +enrichIngredient(UUID id) Ingredient
    }

    class RecipeIngredient {
        +Decimal quantity
        +String unit
    }

    class PantryItem {
        +UUID id
        +Decimal quantity
        +String unit
    }

    class ShoppingList {
        +UUID id
    }

    class ShoppingListItem {
        +UUID id
        +Decimal quantityNeeded
        +String unit
        +Boolean purchased
    }

    class DietType {
        <<enumeration>>
        OMNIVORE
        VEGETARIAN
        VEGAN
        KETO
    }

    class CuisineType {
        <<enumeration>>
        ITALIAN
        POLISH
				EUROPEAN_OTHER
				SOUTH_AMERICAN
				MIDDLE_EASTERN
        ASIAN
        OTHER
    }

    class RecipeLifecycleStatus {
        <<enumeration>>
        DRAFT
        ACTIVE
        ARCHIVED
    }

    class MealSuggestionService {
        +suggestRecipes(UUID userId) List~Recipe~
    }

    class RecipeManagementService {
        <<service>>
        +createDraft(UUID userId) Recipe
        +updateRecipe(UUID recipeId, metadata) void
        +setIngredients(UUID recipeId, lines) void
        +estimateKcal(UUID recipeId, servings, lines) Integer
        +publish(UUID recipeId) void
        +archive(UUID recipeId) void
        +deleteRecipe(UUID recipeId) void
        +listByOwner(UUID userId, filters) List~Recipe~
    }

    class ShoppingListService {
        <<service>>
        +getOrCreateActiveList(UUID userId) ShoppingList
        +fillMissingFromRecipes(UUID userId, recipeIds) void
        +addManualItem(UUID userId, ingredientId, qty, unit) void
        +markPurchased(UUID itemId, purchased) void
        +removeItem(UUID itemId) void
    }

    class PantryService {
        <<service>>
        +upsertItem(UUID userId, ingredientId, qty, unit) void
        +adjustQuantity(UUID pantryItemId, delta) void
        +removeItem(UUID pantryItemId) void
        +listPantry(UUID userId) List~PantryItem~
    }

    User "1" --> "*" Recipe : posiada
    User "1" --> "*" PantryItem : przechowuje
    User "1" --> "0..1" ShoppingList : aktywna_lista

    Recipe "1" *-- "*" RecipeIngredient : sklad
    Ingredient "1" <-- "*" RecipeIngredient : wystepuje_w

    ShoppingList "1" *-- "*" ShoppingListItem : pozycje
    Ingredient "1" <-- "*" ShoppingListItem : dotyczy
    Ingredient "1" <-- "*" PantryItem : stan

    Recipe --> DietType
    Recipe --> CuisineType
    Recipe --> RecipeLifecycleStatus

    MealSuggestionService ..> User : odczyt
    MealSuggestionService ..> Recipe : odczyt
    MealSuggestionService ..> PantryItem : odczyt

    RecipeManagementService ..> User : wlasciciel
    RecipeManagementService ..> Recipe : zapis
    RecipeManagementService ..> RecipeIngredient : zapis
    RecipeManagementService ..> Ingredient : rozpoznanie

    ShoppingListService ..> User : wlasciciel
    ShoppingListService ..> ShoppingList : zapis
    ShoppingListService ..> ShoppingListItem : zapis
    ShoppingListService ..> Recipe : odczyt_skladu
    ShoppingListService ..> RecipeIngredient : odczyt
    ShoppingListService ..> PantryItem : porownanie
    ShoppingListService ..> Ingredient : rozpoznanie

    PantryService ..> User : wlasciciel
    PantryService ..> PantryItem : zapis
    PantryService ..> Ingredient : rozpoznanie

    NutritionService ..> DeeplTranslationService : tlumaczenie
    NutritionService ..> Ingredient : zapis_kaloryki
    RecipeManagementService ..> NutritionService : wzbogacanie_skladu
```

---

## Diagram obiektów (snapshot)

**Cel:** pokazać **konkretną chwilę** w działaniu systemu - instancje i linki, a nie typy. Uzupełnia diagram klas i ułatwia sprawdzenie, czy multiplicities mają sens w przykładowym scenariuszu.

**Ograniczenia:** Mermaid nie ma pełnej notacji UML „obiektowej”; użyto klas ze stereotypem `<<object>>` oraz przykładowych wartości atrybutów.

```mermaid
classDiagram
    direction TB

    class Anna {
        <<object>>
        +email = "anna.k@example.com"
    }

    class PestoPasta {
        <<object>>
        +title = "Makaron z pesto"
        +servings = 4
        +lifecycleStatus = ACTIVE
    }

    class Pasta {
        <<object>>
        +quantity = 400
        +unit = "g"
    }

    class Pesto {
        <<object>>
        +quantity = 2
        +unit = "lyzki"
    }

    class IngSpaghetti {
        <<object>>
        +name = "Makaron spaghetti"
    }

    class IngBasilFresh {
        <<object>>
        +name = "Liscie bazylii"
    }

		class IngGarlicFresh {
        <<object>>
        +name = "Czosnek swiezy"
    }

		class IngPiniaNuts {
        <<object>>
        +name = "Orzeszki pinii"
    }

    class PantryPasta {
        <<object>>
        +quantity = 500
        +unit = "g"
    }

    class PantryOliveOil {
        <<object>>
        +quantity = 200
        +unit = "ml"
    }

    Anna --> PestoPasta : wlasciciel_przepisu
    PestoPasta --> Pasta : wymaga
    PestoPasta --> Pesto : wymaga
    Pasta --> IngSpaghetti : skladnik
    Pesto --> IngBasilFresh : skladnik
    Pesto --> IngGarlicFresh : skladnik
    Pesto --> IngPiniaNuts : skladnik

    Anna --> PantryPasta : ma_w_spizarni
    Anna --> PantryOliveOil : ma_w_spizarni
    PantryPasta --> IngSpaghetti : ten_sam_skladnik
```

W tym migawce Anna ma w spiżarni makaron i oliwę w ilościach wystarczających na przepis; brakujące składniki (np. bazylia, czosnek czy orzeszki pinii) mogłyby pojawić się jako obiekty `ShoppingListItem` w rozszerzonej wersji tego samego diagramu.

---

## Diagram pakietów

**Cel:** pokazać **warstwy logiczne** zgodne z kontenerami z C4 (SPA, backend, baza), ale w ujęciu pakietów zależności - bez listy wszystkich klas.

**Ograniczenia:** zależność aplikacji od infrastruktury jest często realizowana przez wstrzykiwanie implementacji repozytoriów; na diagramie zaznaczono to jako użycie infrastruktury przez warstwę aplikacji.

```mermaid
flowchart TB
    subgraph presentation["presentation"]
        spa[SinglePageApplication]
    end

    subgraph application["application"]
        rest[REST_API]
        recipeSvc[RecipeManagementService]
        shoppingSvc[ShoppingListService]
        pantrySvc[PantryService]
        sugg[MealSuggestionService]
    end

    subgraph domain["domain"]
        entities[Entities]
    end

    subgraph infrastructure["infrastructure"]
        repos[SqlRepositories]
        deepl[DeeplTranslationClient]
        nut[NutritionApiClient]
        recsearch[RecipeSearchApiClient]
    end

    subgraph nutrition["nutrition"]
        nutritionSvc[NutritionService]
    end

    spa -->|JSON_HTTPS| rest
    rest --> recipeSvc
    rest --> shoppingSvc
    rest --> pantrySvc
    rest --> sugg
    rest --> nutritionSvc
    recipeSvc --> domain
    shoppingSvc --> domain
    pantrySvc --> domain
    sugg --> domain
    rest --> repos
    recipeSvc --> repos
    shoppingSvc --> repos
    pantrySvc --> repos
    sugg --> nut
    sugg --> recsearch
    nutritionSvc --> deepl
    nutritionSvc --> nut
    nutritionSvc --> domain
    recipeSvc --> nutritionSvc
    repos --> domain
    nut --> domain
    recsearch --> domain
    deepl --> domain
```

---

## Diagram stanu: cykl życia przepisu

**Cel:** opisać stany `Recipe` istotne dla użytkownika tworzącego własną bazę - od szkicu do archiwum.

```mermaid
stateDiagram-v2
    [*] --> DRAFT : create_recipe
    DRAFT --> ACTIVE : publish_recipe
    ACTIVE --> DRAFT : draft_recipe
    ACTIVE --> ARCHIVED : archive_recipe
    ARCHIVED --> ACTIVE : unarchive_recipe
    ARCHIVED --> [*] : remove_recipe
```

Mapowanie na model klas: stan odpowiada atrybutowi `lifecycleStatus` (`DRAFT`, `ACTIVE`, `ARCHIVED`).

---

## Diagram stanu: pozycja na liście zakupów

**Cel:** pokazać, jak **pozycja listy zakupów** przechodzi między stanami od zapotrzebowania do domowej spiżarni (uproszczony model; w implementacji można scalać stany z `PantryItem`).

```mermaid
stateDiagram-v2
    [*] --> SHOPPING_LIST : add_shopping_list_item
    SHOPPING_LIST --> PANTRY : mark_as_bought
    PANTRY --> [*] : remove_pantry_item
    SHOPPING_LIST --> [*] : cancel_shopping_list_item
```
