import { apiClient } from '@/api/client'
import { ensureArray } from '@/lib/ensure-array'
import { normalizeRecipeIngredientLines } from '@/lib/recipe-ingredients'
import type { CuisineType, DietType, PantryItem, Recipe, RecipeIngredientLine } from '@/types/domain'

export interface RecipeFilters {
  diet?: DietType
  cuisine?: CuisineType
  kcalMin?: number
  kcalMax?: number
}

export async function listRecipes(filters?: RecipeFilters): Promise<Recipe[]> {
  const { data } = await apiClient.get<Recipe[]>('/recipes', { params: filters })
  return ensureArray<Recipe>(data, 'recipes')
}

export async function getRecipe(id: string): Promise<Recipe> {
  const { data } = await apiClient.get<Recipe>(`/recipes/${id}`)
  return data
}

export async function createRecipe(body: {
  title: string
  instructions?: string
  estimatedKcalPerServing?: number
  servings?: number
  dietType?: DietType
  cuisineType?: CuisineType
}): Promise<Recipe> {
  const { data } = await apiClient.post<Recipe>('/recipes', body)
  return data
}

export async function updateRecipe(
  id: string,
  body: Partial<{
    title: string
    instructions: string
    estimatedKcalPerServing: number
    servings: number
    dietType: DietType
    cuisineType: CuisineType
  }>,
): Promise<Recipe> {
  const { data } = await apiClient.patch<Recipe>(`/recipes/${id}`, body)
  return data
}

export async function setRecipeIngredients(
  id: string,
  ingredients: RecipeIngredientLine[],
): Promise<Recipe> {
  const { data } = await apiClient.put<Recipe>(`/recipes/${id}/ingredients`, {
    ingredients: normalizeRecipeIngredientLines(ingredients),
  })
  return data
}

export async function deleteRecipe(id: string): Promise<void> {
  await apiClient.delete(`/recipes/${id}`)
}

type LifecycleAction = 'publish' | 'archive' | 'unarchive' | 'draft'

export async function recipeLifecycle(id: string, action: LifecycleAction): Promise<Recipe> {
  const { data } = await apiClient.post<Recipe>(`/recipes/${id}/${action}`)
  return data
}

export async function cookRecipe(id: string): Promise<PantryItem[]> {
  const { data } = await apiClient.post<PantryItem[]>(`/recipes/${id}/cook`)
  return data
}

export type KcalSkipReason = 'no_kcal_data' | 'no_mass_unit'

export interface RecipeKcalEstimate {
  servings: number
  totalKcal: number
  estimatedKcalPerServing: number
  includedCount: number
  skipped: {
    ingredientId: string
    name: string
    reason: KcalSkipReason
    unit?: string
  }[]
}

export async function estimateRecipeKcal(
  id: string,
  body: { servings?: number; ingredients?: RecipeIngredientLine[] },
): Promise<RecipeKcalEstimate> {
  const { data } = await apiClient.post<RecipeKcalEstimate>(
    `/recipes/${id}/estimate-kcal`,
    {
      servings: body.servings,
      ingredients: body.ingredients
        ? normalizeRecipeIngredientLines(body.ingredients)
        : undefined,
    },
  )
  return data
}
