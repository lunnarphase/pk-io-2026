import { describe, expect, it } from 'vitest'
import { ensureArray } from '@/lib/ensure-array'

describe('ensureArray', () => {
  it('returns array when value is array', () => {
    expect(ensureArray([1, 2], 'test')).toEqual([1, 2])
  })

  it('throws when value is not array', () => {
    expect(() => ensureArray({ items: [] }, 'recipes')).toThrow(
      'API recipes: expected array response',
    )
  })
})
