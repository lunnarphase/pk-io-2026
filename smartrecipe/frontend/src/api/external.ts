import { apiClient } from '@/api/client'
import type { ExternalRecipeSearchPage, Recipe } from '@/types/domain'

export async function searchExternalRecipes(
  q: string,
  offset = 0,
): Promise<ExternalRecipeSearchPage> {
  const { data } = await apiClient.get<ExternalRecipeSearchPage>('/external/recipes/search', {
    params: { q, offset },
  })
  return data
}

export async function importExternalRecipe(externalId: string | number): Promise<Recipe> {
  const { data } = await apiClient.post<Recipe>('/external/recipes/import', {
    externalId: String(externalId),
  })
  return data
}
