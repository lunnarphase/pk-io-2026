import { apiClient } from '@/api/client'
import type { ShoppingList, ShoppingListItem } from '@/types/domain'

export async function getShoppingList(): Promise<ShoppingList> {
  const { data } = await apiClient.get<ShoppingList>('/shopping-list')
  return data
}

export async function fillShoppingList(recipeIds: string[]): Promise<ShoppingList> {
  const { data } = await apiClient.post<ShoppingList>('/shopping-list/fill', { recipeIds })
  return data
}

export async function addShoppingItem(body: {
  ingredientId: string
  quantityNeeded: number
  unit: string
}): Promise<ShoppingListItem> {
  const { data } = await apiClient.post<ShoppingListItem>('/shopping-list/items', body)
  return data
}

export async function patchShoppingItem(
  id: string,
  body: { purchased?: boolean; quantityNeeded?: number; unit?: string },
): Promise<ShoppingListItem> {
  const { data } = await apiClient.patch<ShoppingListItem>(`/shopping-list/items/${id}`, body)
  return data
}

export async function deleteShoppingItem(id: string): Promise<void> {
  await apiClient.delete(`/shopping-list/items/${id}`)
}

export async function clearShoppingList(): Promise<void> {
  await apiClient.delete('/shopping-list/items')
}

export async function syncPurchasedToPantry(): Promise<ShoppingList> {
  const { data } = await apiClient.post<ShoppingList>('/shopping-list/sync-pantry')
  return data
}
