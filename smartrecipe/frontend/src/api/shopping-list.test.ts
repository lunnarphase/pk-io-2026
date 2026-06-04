import { describe, expect, it, vi } from 'vitest'
import {
  addShoppingItem,
  clearShoppingList,
  deleteShoppingItem,
  fillShoppingList,
  getShoppingList,
  patchShoppingItem,
  syncPurchasedToPantry,
} from '@/api/shopping-list'
import { apiClient } from '@/api/client'

vi.mock('@/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('shopping list API (ShoppingListService / UC04)', () => {
  it('loads active shopping list', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { id: 'sl-1', items: [] },
    })
    const list = await getShoppingList()
    expect(apiClient.get).toHaveBeenCalledWith('/shopping-list')
    expect(list.id).toBe('sl-1')
  })

  it('fillMissingFromRecipes posts recipe ids', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      data: { id: 'sl-1', items: [{ id: 'item-1' }] },
    })
    await fillShoppingList(['r1', 'r2'])
    expect(apiClient.post).toHaveBeenCalledWith('/shopping-list/fill', {
      recipeIds: ['r1', 'r2'],
    })
  })

  it('syncPurchasedToPantry moves bought items to pantry', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      data: { id: 'sl-1', items: [] },
    })
    await syncPurchasedToPantry()
    expect(apiClient.post).toHaveBeenCalledWith('/shopping-list/sync-pantry')
  })

  it('addShoppingItem posts line', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      data: {
        id: 'item-1',
        ingredientId: 'ing-1',
        quantityNeeded: 2,
        unit: 'kg',
        purchased: false,
      },
    })
    await addShoppingItem({
      ingredientId: 'ing-1',
      quantityNeeded: 2,
      unit: 'kg',
    })
    expect(apiClient.post).toHaveBeenCalledWith('/shopping-list/items', {
      ingredientId: 'ing-1',
      quantityNeeded: 2,
      unit: 'kg',
    })
  })

  it('patchShoppingItem updates purchased flag', async () => {
    vi.mocked(apiClient.patch).mockResolvedValue({
      data: {
        id: 'item-1',
        ingredientId: 'ing-1',
        quantityNeeded: 1,
        unit: 'szt',
        purchased: true,
      },
    })
    await patchShoppingItem('item-1', { purchased: true })
    expect(apiClient.patch).toHaveBeenCalledWith('/shopping-list/items/item-1', {
      purchased: true,
    })
  })

  it('deleteShoppingItem removes line', async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({})
    await deleteShoppingItem('item-1')
    expect(apiClient.delete).toHaveBeenCalledWith('/shopping-list/items/item-1')
  })

  it('clearShoppingList deletes all items', async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({})
    await clearShoppingList()
    expect(apiClient.delete).toHaveBeenCalledWith('/shopping-list/items')
  })
})
