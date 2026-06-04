import { describe, expect, it } from 'vitest'
import { skipSummary } from '@/lib/recipe-kcal-skip-summary'

describe('skipSummary (estimateKcal skipped lines)', () => {
  it('returns empty string when nothing was skipped', () => {
    expect(skipSummary([])).toBe('')
  })

  it('summarizes no_kcal_data and no_mass_unit reasons', () => {
    const text = skipSummary([
      { ingredientId: 'a', name: 'Sól', reason: 'no_kcal_data' },
      { ingredientId: 'b', name: 'Jajko', reason: 'no_mass_unit', unit: 'szt' },
      { ingredientId: 'c', name: 'Pieprz', reason: 'no_kcal_data' },
    ])
    expect(text).toContain('2 bez kaloryki')
    expect(text).toContain('1 w szt./łyżkach')
  })
})
