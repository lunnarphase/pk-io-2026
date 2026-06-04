import { describe, expect, it } from 'vitest'
import { recipeIngredientSummary } from '@/lib/recipe-ingredient-summary'
import { RecipeLifecycleStatus, type Recipe } from '@/types/domain'

function recipe(partial: Partial<Recipe>): Recipe {
  return {
    id: 'r1',
    title: 'Test',
    instructions: null,
    estimatedKcalPerServing: null,
    servings: null,
    lifecycleStatus: RecipeLifecycleStatus.ACTIVE,
    dietType: null,
    cuisineType: null,
    ...partial,
  }
}

describe('recipeIngredientSummary', () => {
  it('shows placeholder when recipe has no ingredient lines', () => {
    expect(recipeIngredientSummary(recipe({ ingredients: [] }))).toBe(
      'Brak składników',
    )
  })

  it('formats up to three ingredient quantities', () => {
    const summary = recipeIngredientSummary(
      recipe({
        ingredients: [
          { ingredientId: 'a', quantity: 200, unit: 'g' },
          { ingredientId: 'b', quantity: 2, unit: 'szt' },
          { ingredientId: 'c', quantity: 1.5, unit: 'l' },
          { ingredientId: 'd', quantity: 1, unit: 'kg' },
        ],
      }),
    )
    expect(summary).toBe('200 g · 2 szt · 1.5 l')
  })
})
