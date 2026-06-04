import { describe, expect, it, vi } from 'vitest'
import { deletePantryItem, getPantry, upsertPantryItem } from '@/api/pantry'
import { apiClient } from '@/api/client'

vi.mock('@/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('pantry API (PantryService / UC01)', () => {
  it('lists pantry items', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: [{ id: 'p1', ingredientId: 'i1', quantity: 2, unit: 'kg' }],
    })
    const items = await getPantry()
    expect(apiClient.get).toHaveBeenCalledWith('/pantry')
    expect(items[0]?.unit).toBe('kg')
  })

  it('upserts quantity with set or add mode', async () => {
    vi.mocked(apiClient.put).mockResolvedValue({
      data: { id: 'p1', ingredientId: 'i1', quantity: 3, unit: 'szt' },
    })
    await upsertPantryItem('i1', { quantity: 3, unit: 'szt', mode: 'add' })
    expect(apiClient.put).toHaveBeenCalledWith('/pantry/items/i1', {
      quantity: 3,
      unit: 'szt',
      mode: 'add',
    })
  })

  it('deletes pantry line by ingredient id', async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({})
    await deletePantryItem('i1')
    expect(apiClient.delete).toHaveBeenCalledWith('/pantry/items/i1')
  })
})
