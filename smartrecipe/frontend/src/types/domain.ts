export enum DietType {
  OMNIVORE = 'OMNIVORE',
  VEGETARIAN = 'VEGETARIAN',
  VEGAN = 'VEGAN',
  KETO = 'KETO',
}

export enum CuisineType {
  ITALIAN = 'ITALIAN',
  POLISH = 'POLISH',
  EUROPEAN_OTHER = 'EUROPEAN_OTHER',
  SOUTH_AMERICAN = 'SOUTH_AMERICAN',
  MIDDLE_EASTERN = 'MIDDLE_EASTERN',
  ASIAN = 'ASIAN',
  OTHER = 'OTHER',
}

export enum RecipeLifecycleStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export interface Ingredient {
  id: string
  name: string
  externalFoodId?: string | null
  kcalPer100g?: number | null
  /** Grams per 1 szt from USDA (auto); used in kcal estimate. */
  gramsPerPiece?: number | null
}

export type IngredientPantryMatchStatus = 'sufficient' | 'deficit' | 'missing' | 'incompatible'

export interface IngredientPantryMatch {
  status: IngredientPantryMatchStatus
  pantryQuantity?: number
  pantryUnit?: string
  deficitQuantity?: number
  deficitUnit?: string
}

export interface RecipeIngredientLine {
  ingredientId: string
  quantity: number
  unit: string
  ingredient?: Ingredient
  /** Present on GET /recipes/:id for ACTIVE recipes */
  pantryMatch?: IngredientPantryMatch
}

export interface Recipe {
  id: string
  title: string
  instructions: string | null
  estimatedKcalPerServing: number | null
  servings: number | null
  lifecycleStatus: RecipeLifecycleStatus
  dietType: DietType | null
  cuisineType: CuisineType | null
  ingredients?: RecipeIngredientLine[]
  /** Present on GET /recipes/:id for ACTIVE recipes - missing pantry lines count */
  pantryMissingCount?: number
  createdAt?: string
  updatedAt?: string
}

export interface PantryItem {
  id: string
  ingredientId: string
  quantity: number
  unit: string
  ingredient?: Ingredient
}

export interface ShoppingListItem {
  id: string
  ingredientId: string
  quantityNeeded: number
  unit: string
  purchased: boolean
  ingredient?: Ingredient
}

export interface ShoppingList {
  id: string
  items: ShoppingListItem[]
}

export interface SuggestionResult {
  available: Recipe[]
  almostAvailable: { recipe: Recipe; missingCount: number }[]
  needsMore: { recipe: Recipe; missingCount: number }[]
}

export interface ExternalRecipeHit {
  id: string | number
  title: string
  sourceUrl?: string
}

export interface ExternalRecipeSearchPage {
  results: ExternalRecipeHit[]
  offset: number
  number: number
  totalResults: number
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}
