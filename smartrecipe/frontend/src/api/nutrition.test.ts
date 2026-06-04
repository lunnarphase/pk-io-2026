import { describe, expect, it, vi } from 'vitest'
import {
  enrichIngredientAuto,
  enrichIngredientByFdc,
  searchNutritionFoods,
} from '@/api/nutrition'
import { apiClient } from '@/api/client'

vi.mock('@/api/client', () => ({
  apiClient: { get: vi.fn(), post: vi.fn() },
}))

describe('nutrition API (USDA / DeepL flow)', () => {
  it('searchNutritionFoods queries with limit', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: [{ fdcId: 1, description: 'Apple', kcalPer100g: 52 }],
    })
    await searchNutritionFoods('apple', 5)
    expect(apiClient.get).toHaveBeenCalledWith('/nutrition/search', {
      params: { q: 'apple', limit: 5 },
    })
  })

  it('enrichIngredientAuto posts to enrich endpoint', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      data: { id: 'ing-1', name: 'Jabłko', kcalPer100g: 52 },
    })
    await enrichIngredientAuto('ing-1')
    expect(apiClient.post).toHaveBeenCalledWith('/nutrition/enrich/ing-1')
  })

  it('enrichIngredientByFdc posts selected FDC id', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      data: { id: 'ing-1', name: 'Jabłko', kcalPer100g: 52, externalFoodId: '123' },
    })
    await enrichIngredientByFdc('ing-1', 123)
    expect(apiClient.post).toHaveBeenCalledWith('/nutrition/enrich/ing-1/fdc/123')
  })
})
