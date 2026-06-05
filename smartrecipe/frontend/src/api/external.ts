import { apiClient } from '@/api/client'
import type { ExternalRecipeSearchPage, Recipe } from '@/types/domain'

function normalizeExternalSearchPage(
  data: unknown,
  fallbackOffset: number,
): ExternalRecipeSearchPage {
  if (!data || typeof data !== 'object') {
    return { results: [], offset: fallbackOffset, number: 0, totalResults: 0 }
  }
  const page = data as Partial<ExternalRecipeSearchPage>
  const results = Array.isArray(page.results) ? page.results : []
  return {
    results,
    offset: typeof page.offset === 'number' ? page.offset : fallbackOffset,
    number: typeof page.number === 'number' ? page.number : results.length,
    totalResults:
      typeof page.totalResults === 'number' ? page.totalResults : results.length,
  }
}

export async function searchExternalRecipes(
  q: string,
  offset = 0,
): Promise<ExternalRecipeSearchPage> {
  const { data } = await apiClient.get<ExternalRecipeSearchPage>('/external/recipes/search', {
    params: { q, offset },
  })
  return normalizeExternalSearchPage(data, offset)
}

export async function importExternalRecipe(externalId: string | number): Promise<Recipe> {
  const { data } = await apiClient.post<Recipe>('/external/recipes/import', {
    externalId: String(externalId),
  })
  return data
}
