import { apiClient } from '@/api/client'
import type { Ingredient } from '@/types/domain'

export async function searchIngredients(search: string): Promise<Ingredient[]> {
  const { data } = await apiClient.get<Ingredient[]>('/ingredients', {
    params: search ? { search } : undefined,
  })
  return data
}

export async function createIngredient(name: string): Promise<Ingredient> {
  const { data } = await apiClient.post<Ingredient>('/ingredients', { name })
  return data
}
