import { describe, expect, it } from 'vitest'
import { getIngredientPantryTooltip } from '@/features/recipes/recipe-pantry-tooltip'
import type { IngredientPantryMatch } from '@/types/domain'

describe('getIngredientPantryTooltip (pantryMatch on ACTIVE recipes)', () => {
  it('returns nothing when pantry stock is sufficient', () => {
    expect(
      getIngredientPantryTooltip({ status: 'sufficient' }),
    ).toBeUndefined()
  })

  it('explains incompatible units', () => {
    expect(getIngredientPantryTooltip({ status: 'incompatible' })).toContain(
      'inna jednostka',
    )
  })

  it('formats deficit with pantry snapshot', () => {
    const match: IngredientPantryMatch = {
      status: 'deficit',
      deficitQuantity: 150,
      deficitUnit: 'g',
      pantryQuantity: 50,
      pantryUnit: 'g',
    }
    expect(getIngredientPantryTooltip(match)).toBe(
      'Brakuje 150 g. W spiżarni masz 50 g.',
    )
  })

  it('handles missing pantry line', () => {
    expect(getIngredientPantryTooltip({ status: 'missing' })).toBe(
      'Brakuje w spiżarni.',
    )
  })

  it('formats deficit without pantry snapshot', () => {
    expect(
      getIngredientPantryTooltip({
        status: 'deficit',
        deficitQuantity: 2,
        deficitUnit: 'szt',
      }),
    ).toBe('Brakuje 2 szt w spiżarni.')
  })
})
