import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  cookRecipe,
  createRecipe,
  deleteRecipe,
  estimateRecipeKcal,
  getRecipe,
  listRecipes,
  recipeLifecycle,
  setRecipeIngredients,
  updateRecipe,
} from '@/api/recipes'
import { apiClient } from '@/api/client'
import { CuisineType, DietType, RecipeLifecycleStatus } from '@/types/domain'

vi.mock('@/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

const mockRecipe = {
  id: 'recipe-1',
  title: 'Omlet',
  instructions: null,
  estimatedKcalPerServing: 320,
  servings: 2,
  lifecycleStatus: RecipeLifecycleStatus.DRAFT,
  dietType: DietType.OMNIVORE,
  cuisineType: CuisineType.POLISH,
}

describe('recipes API (RecipeManagementService)', () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockReset()
    vi.mocked(apiClient.post).mockReset()
    vi.mocked(apiClient.put).mockReset()
  })

  it('listRecipes passes diet/cuisine/kcal filters', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: [mockRecipe] })
    await listRecipes({
      diet: DietType.VEGAN,
      cuisine: CuisineType.ASIAN,
      kcalMin: 200,
      kcalMax: 600,
    })
    expect(apiClient.get).toHaveBeenCalledWith('/recipes', {
      params: {
        diet: DietType.VEGAN,
        cuisine: CuisineType.ASIAN,
        kcalMin: 200,
        kcalMax: 600,
      },
    })
  })

  it('setRecipeIngredients normalizes quantities before PUT', async () => {
    vi.mocked(apiClient.put).mockResolvedValue({ data: mockRecipe })
    await setRecipeIngredients('recipe-1', [
      { ingredientId: 'ing-1', quantity: 0, unit: 'g' },
    ])
    expect(apiClient.put).toHaveBeenCalledWith('/recipes/recipe-1/ingredients', {
      ingredients: [{ ingredientId: 'ing-1', quantity: 1, unit: 'g' }],
    })
  })

  it('recipeLifecycle posts publish/archive transitions', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      data: { ...mockRecipe, lifecycleStatus: RecipeLifecycleStatus.ACTIVE },
    })
    const published = await recipeLifecycle('recipe-1', 'publish')
    expect(apiClient.post).toHaveBeenCalledWith('/recipes/recipe-1/publish')
    expect(published.lifecycleStatus).toBe(RecipeLifecycleStatus.ACTIVE)
  })

  it('estimateRecipeKcal sends servings and normalized lines', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      data: {
        servings: 4,
        totalKcal: 1200,
        estimatedKcalPerServing: 300,
        includedCount: 2,
        skipped: [],
      },
    })
    await estimateRecipeKcal('recipe-1', {
      servings: 4,
      ingredients: [
        { ingredientId: 'a', quantity: '50' as unknown as number, unit: 'g' },
      ],
    })
    expect(apiClient.post).toHaveBeenCalledWith('/recipes/recipe-1/estimate-kcal', {
      servings: 4,
      ingredients: [{ ingredientId: 'a', quantity: 50, unit: 'g' }],
    })
  })

  it('getRecipe fetches detail by id', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockRecipe })
    const recipe = await getRecipe('recipe-1')
    expect(apiClient.get).toHaveBeenCalledWith('/recipes/recipe-1')
    expect(recipe.title).toBe('Omlet')
  })

  it('createRecipe posts body', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: mockRecipe })
    await createRecipe({ title: 'Nowy', dietType: DietType.VEGAN })
    expect(apiClient.post).toHaveBeenCalledWith('/recipes', {
      title: 'Nowy',
      dietType: DietType.VEGAN,
    })
  })

  it('updateRecipe patches fields', async () => {
    vi.mocked(apiClient.patch).mockResolvedValue({ data: mockRecipe })
    await updateRecipe('recipe-1', { title: 'Zmieniony', servings: 3 })
    expect(apiClient.patch).toHaveBeenCalledWith('/recipes/recipe-1', {
      title: 'Zmieniony',
      servings: 3,
    })
  })

  it('deleteRecipe calls DELETE', async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({})
    await deleteRecipe('recipe-1')
    expect(apiClient.delete).toHaveBeenCalledWith('/recipes/recipe-1')
  })

  it('cookRecipe posts cook action', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: [] })
    await cookRecipe('recipe-1')
    expect(apiClient.post).toHaveBeenCalledWith('/recipes/recipe-1/cook')
  })
})
