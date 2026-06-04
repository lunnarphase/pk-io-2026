import { describe, expect, it } from 'vitest'
import { DEFAULT_UNIT, isKnownUnit, UNIT_OPTIONS } from '@/lib/unit-options'

describe('unit options (aligned with backend UnitNormalizationService)', () => {
  it('includes mass, volume, piece and spoon units', () => {
    const values = UNIT_OPTIONS.map((o) => o.value).filter(Boolean)
    expect(values).toContain('g')
    expect(values).toContain('ml')
    expect(values).toContain('szt')
    expect(values).toContain('tbsp')
  })

  it('defaults pantry/recipe lines to szt', () => {
    expect(DEFAULT_UNIT).toBe('szt')
  })

  it('isKnownUnit recognizes catalog units', () => {
    expect(isKnownUnit('g')).toBe(true)
    expect(isKnownUnit('unknown')).toBe(false)
  })
})
