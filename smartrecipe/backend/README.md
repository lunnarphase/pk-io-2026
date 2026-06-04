# SmartRecipe - Backend API

Backend systemu SmartRecipe. NestJS + TypeORM + PostgreSQL. Udostępnia REST API z pełną dokumentacją OpenAPI.

## Dokumentacja projektu

| Dokument                                                 | Zawartość                                                                             |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| [`../../README.md`](../../README.md)                     | Opis projektu, C4 Level 1 & 2, skład zespołu                                          |
| [`../../model-statyczny.md`](../../model-statyczny.md)   | Diagram klas, encji, pakietów, stany obiektów                                         |
| [`../../model-dynamiczny.md`](../../model-dynamiczny.md) | Aktorzy, przypadki użycia UC01–UC05, diagramy sekwencji i czynności, wymagania RF/RNF |
| [`../../diagrams/`](../../diagrams/)                     | Źródła Mermaid (C4, UC, sekwencje, diagram klas)                                      |

## Architektura

```
src/
├── auth/               # JWT register/login/refresh (UC - autoryzacja)
├── users/              # Encja User, izolacja danych per userId
├── ingredients/        # Katalog składników (shared, deduplikacja)
├── recipes/            # UC01 - CRUD przepisów, state machine DRAFT→ACTIVE↔ARCHIVED
├── pantry/             # UC02 - wirtualna spiżarnia (upsert/delete)
├── suggestions/        # UC03 - algorytm dopasowania przepisów do spiżarni
├── shopping-list/      # UC04 - lista zakupów, fillMissingFromRecipes
├── external/           # UC05 - Spoonacular search + import jako DRAFT
├── shared/             # UnitNormalizationService (g↔kg, ml↔l, łyżki↔łyżeczki)
│                       # CurrentUser dekorator
└── domain/
    ├── entities/       # TypeORM entities: User, Recipe, RecipeIngredient,
    │                   #   Ingredient, PantryItem, ShoppingList, ShoppingListItem
    └── enums.ts        # DietType, CuisineType, RecipeLifecycleStatus
```

## Wymagania

- Node.js ≥ 20
- npm ≥ 10
- Docker + Docker Compose (do lokalnej bazy PostgreSQL)

## Pierwsze uruchomienie

### 1. Zmienne środowiskowe

```bash
cp .env.example .env
```

Edytuj `.env` jeśli chcesz zmienić domyślne wartości (port DB, klucze JWT). Domyślna konfiguracja działa bez zmian dla środowiska lokalnego.

### 2. Baza danych (PostgreSQL via Docker)

```bash
# uruchom z katalogu smartrecipe/ (gdzie jest docker-compose.yml)
cd ..
docker compose up -d

# sprawdź status
docker compose ps
```

PostgreSQL nasłuchuje na porcie zdefiniowanym w `.env` (`DB_PORT`, domyślnie `5432`). Jeśli port jest zajęty, zmień `DB_PORT` w `.env`.

### 3. Zależności

```bash
npm install
```

### 4. Uruchomienie dev

```bash
pnpm start:dev
```

Aplikacja startuje na `http://localhost:3000` (lub `PORT` z `.env`).

| URL                              | Opis                                       |
| -------------------------------- | ------------------------------------------ |
| `http://localhost:3000/api`      | Swagger UI - interaktywna dokumentacja API |
| `http://localhost:3000/api-json` | OpenAPI 3.x spec (JSON)                    |

Schemat bazy jest tworzony automatycznie przy starcie (`synchronize: true` w trybie development).

## Endpointy

### Auth

```
POST /auth/register   { email, password }   → { accessToken, refreshToken }
POST /auth/login      { email, password }   → { accessToken, refreshToken }
POST /auth/refresh    { refreshToken }      → { accessToken, refreshToken }
```

Wszystkie pozostałe endpointy wymagają nagłówka `Authorization: Bearer <accessToken>`.

### Składniki

```
GET  /ingredients?search=    szukaj w katalogu
POST /ingredients            dodaj nowy składnik
```

### Przepisy (UC01)

```
GET    /recipes                      lista (filtry: ?diet=&cuisine=&kcalMin=&kcalMax=)
POST   /recipes                      utwórz szkic (DRAFT)
GET    /recipes/:id
PATCH  /recipes/:id                  aktualizuj metadane
PUT    /recipes/:id/ingredients      ustaw skład (zastępuje poprzedni)
POST   /recipes/:id/publish          DRAFT → ACTIVE
POST   /recipes/:id/archive          ACTIVE → ARCHIVED
POST   /recipes/:id/unarchive        ARCHIVED → ACTIVE
POST   /recipes/:id/draft            ACTIVE → DRAFT
DELETE /recipes/:id
```

Niedozwolone przejścia stanów zwracają `422 Unprocessable Entity`.

### Spiżarnia (UC02)

```
GET    /pantry
PUT    /pantry/items/:ingredientId   { quantity, unit }
DELETE /pantry/items/:ingredientId
```

### Propozycje posiłków (UC03)

```
GET /suggestions?diet=&cuisine=
→ { available: Recipe[], almostAvailable: { recipe, missingCount }[] }
```

Przepisy z ≤ 2 brakującymi składnikami trafiają do `almostAvailable` (RF08).

### Lista zakupów (UC04)

```
GET    /shopping-list                           aktywna lista (auto-create)
POST   /shopping-list/fill    { recipeIds[] }   oblicz braki, dodaj do listy
POST   /shopping-list/items                     ręcznie dodaj pozycję
PATCH  /shopping-list/items/:id                 { purchased, quantityNeeded, unit }
DELETE /shopping-list/items/:id
```

### Zewnętrzne przepisy (UC05)

```
GET  /external/recipes/search?q=&offset=  szukaj przez Spoonacular API (stronicowanie po 20)
POST /external/recipes/import        { externalId } → importuj jako DRAFT
```

Wymaga `RECIPE_API_KEY` w `.env`. Bez klucza endpoint zwraca `503`.

### Dane odżywcze (USDA FoodData Central)

```
GET  /nutrition/search?q=&limit=          szukaj składnika w USDA FDC
POST /nutrition/enrich/:ingredientId      auto-wzbogać (pierwszy wynik USDA)
POST /nutrition/enrich/:ingredientId/fdc/:fdcId   wzbogać konkretnym FDC ID
```

Zapisuje `externalFoodId` (USDA FDC ID), `kcalPer100g` oraz - gdy FDC ma porcję - `gramsPerPiece` (domyślna waga 1 szt, bez wyboru w UI).

Polskie nazwy składników są tłumaczone na angielski przez **DeepL** przed zapytaniem do USDA (`DEEPL_API_KEY`). Bez klucza DeepL wyszukiwanie używa oryginalnej nazwy.

**Klucz USDA:** system automatycznie używa `DEMO_KEY` gdy `NUTRITION_API_KEY` nie jest ustawiony (limit: 30 req/godz). Klucz produkcyjny jest **bezpłatny** - rejestracja zajmuje minutę:

```
https://api.data.gov/signup/
```

Po rejestracji ustaw `NUTRITION_API_KEY=<twój_klucz>` w `.env`.

**Przykładowy flow wzbogacania składnika:**

```bash
# 1. Znajdź FDC ID
GET /nutrition/search?q=chicken+breast
# → [{ fdcId: 2187885, description: "CHICKEN BREAST", kcalPer100g: 165 }, ...]

# 2a. Automatycznie zapisz najlepszy wynik
POST /nutrition/enrich/<ingredientId>

# 2b. Lub wybierz konkretny FDC ID ze wyszukiwania
POST /nutrition/enrich/<ingredientId>/fdc/2187885
```

## Zmienne środowiskowe

| Zmienna              | Domyślnie     | Opis                                                                       |
| -------------------- | ------------- | -------------------------------------------------------------------------- |
| `DB_HOST`            | `localhost`   | Host PostgreSQL                                                            |
| `DB_PORT`            | `5432`        | Port PostgreSQL                                                            |
| `DB_NAME`            | `smartrecipe` | Nazwa bazy                                                                 |
| `DB_USER`            | `smartrecipe` | Użytkownik                                                                 |
| `DB_PASS`            | `smartrecipe` | Hasło                                                                      |
| `JWT_SECRET`         | -             | Sekret access tokenu (**zmień w produkcji**)                               |
| `JWT_REFRESH_SECRET` | -             | Sekret refresh tokenu (**zmień w produkcji**)                              |
| `JWT_ACCESS_TTL`     | `900`         | TTL access tokenu w sekundach (15 min)                                     |
| `JWT_REFRESH_TTL`    | `604800`      | TTL refresh tokenu w sekundach (7 dni)                                     |
| `NUTRITION_API_KEY`  | `DEMO_KEY`    | USDA FDC - bezpłatny klucz: api.data.gov/signup (30 req/h bez klucza)      |
| `DEEPL_API_KEY`      | -             | DeepL - tłumaczenie PL→EN nazw składników (klucz Free kończy się na `:fx`) |
| `DEEPL_API_URL`      | -             | Opcjonalny bazowy URL API DeepL (np. `https://api-free.deepl.com/v2`)      |
| `RECIPE_API_KEY`     | -             | Spoonacular - klucz do zewnętrznych przepisów (UC05, opcjonalny)           |
| `PORT`               | `3000`        | Port serwera HTTP                                                          |
| `NODE_ENV`           | `development` | `development` włącza synchronize + SQL logging                             |

## Produkcja

W produkcji ustaw `NODE_ENV=production` - wyłącza automatyczną synchronizację schematu.  
Należy wtedy używać migracji TypeORM:

```bash
pnpm build
pnpm dlx typeorm migration:generate src/migrations/Init -d dist/data-source.js
pnpm dlx typeorm migration:run -d dist/data-source.js
pnpm start:prod
```

## Inne komendy

```bash
pnpm build        # kompilacja TypeScript → dist/
pnpm start        # start z pliku dist/ (wymaga wcześniejszego build)
pnpm start:prod   # jak wyżej, NODE_ENV=production
pnpm lint         # ESLint
pnpm test         # testy jednostkowe (Jest)
pnpm test:e2e     # testy e2e
```
