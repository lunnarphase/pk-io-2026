import { describe, expect, it } from 'vitest'
import {
  defaultSuggestTab,
  parseSuggestTab,
} from '@/features/suggestions/suggest-tab-utils'

describe('parseSuggestTab', () => {
  it('accepts valid tab ids from URL', () => {
    expect(parseSuggestTab('ready')).toBe('ready')
    expect(parseSuggestTab('almost')).toBe('almost')
    expect(parseSuggestTab('needs-more')).toBe('needs-more')
  })

  it('rejects unknown values', () => {
    expect(parseSuggestTab(null)).toBeUndefined()
    expect(parseSuggestTab('invalid')).toBeUndefined()
  })
})

describe('defaultSuggestTab (MealSuggestionService buckets)', () => {
  it('prefers ready when any fully matched recipes exist', () => {
    expect(
      defaultSuggestTab({ ready: 1, almost: 5, needsMore: 10 }),
    ).toBe('ready')
  })

  it('falls back to almost, then needs-more', () => {
    expect(defaultSuggestTab({ ready: 0, almost: 2, needsMore: 3 })).toBe(
      'almost',
    )
    expect(defaultSuggestTab({ ready: 0, almost: 0, needsMore: 1 })).toBe(
      'needs-more',
    )
  })

  it('defaults to ready when all buckets are empty', () => {
    expect(defaultSuggestTab({ ready: 0, almost: 0, needsMore: 0 })).toBe(
      'ready',
    )
  })
})
