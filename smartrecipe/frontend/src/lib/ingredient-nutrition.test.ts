import { describe, expect, it } from 'vitest'
import {
  formatIngredientKcal,
  hasIngredientKcal,
  normalizeIngredient,
} from '@/lib/ingredient-nutrition'
import type { Ingredient } from '@/types/domain'

describe('normalizeIngredient (USDA / TypeORM decimals)', () => {
  it('parses string kcal and gramsPerPiece', () => {
    const raw = {
      id: '1',
      name: 'Jabłko',
      kcalPer100g: '52' as unknown as number,
      gramsPerPiece: '182' as unknown as number,
    } satisfies Ingredient
    expect(normalizeIngredient(raw)).toEqual({
      id: '1',
      name: 'Jabłko',
      kcalPer100g: 52,
      gramsPerPiece: 182,
      externalFoodId: null,
    })
  })
})

describe('hasIngredientKcal / formatIngredientKcal', () => {
  it('detects linked nutrition data', () => {
    const withKcal: Ingredient = { id: '1', name: 'Ryż', kcalPer100g: 130 }
    const without: Ingredient = { id: '2', name: 'Sól' }
    expect(hasIngredientKcal(withKcal)).toBe(true)
    expect(hasIngredientKcal(without)).toBe(false)
    expect(formatIngredientKcal(withKcal)).toBe('130 kcal / 100 g')
    expect(formatIngredientKcal(without)).toBe('')
  })
})
