import { describe, expect, it, vi } from 'vitest'
import { importExternalRecipe, searchExternalRecipes } from '@/api/external'
import { apiClient } from '@/api/client'
import { RecipeLifecycleStatus } from '@/types/domain'

vi.mock('@/api/client', () => ({
  apiClient: { get: vi.fn(), post: vi.fn() },
}))

describe('external recipes API (UC05)', () => {
  it('searchExternalRecipes passes query and offset', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { results: [], offset: 0, number: 10, totalResults: 0 },
    })
    await searchExternalRecipes('tofu', 10)
    expect(apiClient.get).toHaveBeenCalledWith('/external/recipes/search', {
      params: { q: 'tofu', offset: 10 },
    })
  })

  it('normalizes malformed search payload', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: {} })
    await expect(searchExternalRecipes('pizza', 5)).resolves.toEqual({
      results: [],
      offset: 5,
      number: 0,
      totalResults: 0,
    })
  })

  it('importExternalRecipe stringifies external id', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      data: {
        id: 'draft-1',
        title: 'Imported',
        instructions: null,
        estimatedKcalPerServing: null,
        servings: null,
        lifecycleStatus: RecipeLifecycleStatus.DRAFT,
        dietType: null,
        cuisineType: null,
      },
    })
    const recipe = await importExternalRecipe(999)
    expect(apiClient.post).toHaveBeenCalledWith('/external/recipes/import', {
      externalId: '999',
    })
    expect(recipe.lifecycleStatus).toBe(RecipeLifecycleStatus.DRAFT)
  })
})
