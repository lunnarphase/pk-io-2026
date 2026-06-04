import { describe, expect, it, vi } from 'vitest'
import { getSuggestions } from '@/api/suggestions'
import { apiClient } from '@/api/client'
import { CuisineType, DietType, RecipeLifecycleStatus } from '@/types/domain'

vi.mock('@/api/client', () => ({
  apiClient: { get: vi.fn() },
}))

describe('getSuggestions (MealSuggestionService / UC03)', () => {
  it('fetches suggestion buckets with optional filters', async () => {
    const payload = {
      available: [{ id: '1', title: 'A', lifecycleStatus: RecipeLifecycleStatus.ACTIVE }],
      almostAvailable: [{ recipe: { id: '2', title: 'B' }, missingCount: 1 }],
      needsMore: [],
    }
    vi.mocked(apiClient.get).mockResolvedValue({ data: payload })

    const result = await getSuggestions({
      diet: DietType.VEGETARIAN,
      cuisine: CuisineType.ITALIAN,
    })

    expect(apiClient.get).toHaveBeenCalledWith('/suggestions', {
      params: { diet: DietType.VEGETARIAN, cuisine: CuisineType.ITALIAN },
    })
    expect(result.available).toHaveLength(1)
    expect(result.almostAvailable[0]?.missingCount).toBe(1)
  })
})
