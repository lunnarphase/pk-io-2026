import { apiClient } from '@/api/client'
import type { CuisineType, DietType, SuggestionResult } from '@/types/domain'

export async function getSuggestions(filters?: {
  diet?: DietType
  cuisine?: CuisineType
}): Promise<SuggestionResult> {
  const { data } = await apiClient.get<SuggestionResult>('/suggestions', { params: filters })
  return data
}
