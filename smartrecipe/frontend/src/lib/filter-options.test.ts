import { describe, expect, it } from 'vitest'
import {
  cuisineFilterOptions,
  dietFilterOptions,
  parseFilterValue,
  parseFormValue,
  toFilterValue,
  toFormValue,
} from '@/lib/filter-options'
import { CuisineType, DietType } from '@/types/domain'

describe('filter URL params (UC03 - diet/cuisine filters)', () => {
  it('parseFilterValue treats "all" as no filter', () => {
    expect(parseFilterValue<DietType>('all')).toBeUndefined()
    expect(parseFilterValue<CuisineType>('all')).toBeUndefined()
  })

  it('parseFilterValue keeps enum values', () => {
    expect(parseFilterValue<DietType>(DietType.VEGAN)).toBe(DietType.VEGAN)
  })

  it('toFilterValue maps undefined to "all"', () => {
    expect(toFilterValue(undefined)).toBe('all')
    expect(toFilterValue(DietType.KETO)).toBe(DietType.KETO)
  })
})

describe('recipe form metadata (Recipe.dietType / cuisineType)', () => {
  it('parseFormValue treats "none" as unset', () => {
    expect(parseFormValue<DietType>('none')).toBeUndefined()
  })

  it('toFormValue maps undefined to "none"', () => {
    expect(toFormValue(undefined)).toBe('none')
  })

  it('exposes all diet and cuisine enum values in options', () => {
    const diets = dietFilterOptions().map((o) => o.value)
    const cuisines = cuisineFilterOptions().map((o) => o.value)
    expect(diets).toContain('all')
    expect(diets).toContain(DietType.VEGETARIAN)
    expect(cuisines).toContain(CuisineType.POLISH)
  })
})
