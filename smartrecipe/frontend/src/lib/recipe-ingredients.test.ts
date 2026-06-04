import { describe, expect, it } from 'vitest'
import {
  normalizeIngredientLine,
  normalizeRecipeIngredientLines,
} from '@/lib/recipe-ingredients'
import type { RecipeIngredientLine } from '@/types/domain'

describe('normalizeRecipeIngredientLines', () => {
  it('coerces decimal string quantities to positive numbers', () => {
    const lines: RecipeIngredientLine[] = [
      { ingredientId: 'a', quantity: '2.5' as unknown as number, unit: 'kg' },
    ]
    expect(normalizeRecipeIngredientLines(lines)).toEqual([
      { ingredientId: 'a', quantity: 2.5, unit: 'kg' },
    ])
  })

  it('falls back to 1 for invalid or non-positive quantities', () => {
    const lines: RecipeIngredientLine[] = [
      { ingredientId: 'a', quantity: 0, unit: 'g' },
      { ingredientId: 'b', quantity: NaN, unit: 'ml' },
    ]
    expect(normalizeRecipeIngredientLines(lines)).toEqual([
      { ingredientId: 'a', quantity: 1, unit: 'g' },
      { ingredientId: 'b', quantity: 1, unit: 'ml' },
    ])
  })
})

describe('normalizeIngredientLine', () => {
  it('normalizes nested ingredient kcal from API strings', () => {
    const line: RecipeIngredientLine = {
      ingredientId: 'ing-1',
      quantity: '100' as unknown as number,
      unit: 'g',
      ingredient: {
        id: 'ing-1',
        name: 'Mąka',
        kcalPer100g: '350' as unknown as number,
        gramsPerPiece: null,
      },
    }
    const result = normalizeIngredientLine(line)
    expect(result.quantity).toBe(100)
    expect(result.ingredient?.kcalPer100g).toBe(350)
  })
})
