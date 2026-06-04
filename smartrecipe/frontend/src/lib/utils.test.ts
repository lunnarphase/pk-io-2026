import { describe, expect, it } from 'vitest'
import { displayEnum, formatUnit } from '@/lib/utils'
import {
  CuisineType,
  DietType,
  RecipeLifecycleStatus,
} from '@/types/domain'

describe('displayEnum', () => {
  it('maps domain enums to Polish labels', () => {
    expect(displayEnum(DietType.VEGAN)).toBe('Wegańska')
    expect(displayEnum(CuisineType.POLISH)).toBe('Polska')
    expect(displayEnum(RecipeLifecycleStatus.DRAFT)).toBe('Szkic')
  })

  it('returns dash for empty values', () => {
    expect(displayEnum(null)).toBe('-')
  })

  it('returns raw value for unknown enum strings', () => {
    expect(displayEnum('UNKNOWN' as DietType)).toBe('UNKNOWN')
  })
})

describe('formatUnit', () => {
  it('formats integer and fractional quantities', () => {
    expect(formatUnit(2, 'szt')).toBe('2 szt')
    expect(formatUnit(1.25, 'kg')).toBe('1.3 kg')
  })

  it('returns empty string without unit', () => {
    expect(formatUnit(1, '')).toBe('')
  })
})
