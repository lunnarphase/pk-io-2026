import { apiClient } from '@/api/client'
import type { PantryItem } from '@/types/domain'

export async function getPantry(): Promise<PantryItem[]> {
  const { data } = await apiClient.get<PantryItem[]>('/pantry')
  return data
}

export async function upsertPantryItem(
  ingredientId: string,
  body: { quantity: number; unit: string; mode?: 'set' | 'add' },
): Promise<PantryItem> {
  const { data } = await apiClient.put<PantryItem>(`/pantry/items/${ingredientId}`, body)
  return data
}

export async function deletePantryItem(ingredientId: string): Promise<void> {
  await apiClient.delete(`/pantry/items/${ingredientId}`)
}
