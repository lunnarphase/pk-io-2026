import { describe, expect, it } from 'vitest'
import { queryKeys } from '@/lib/query-keys'
import { CuisineType, DietType } from '@/types/domain'

describe('queryKeys', () => {
  it('scopes suggestions by diet/cuisine filters', () => {
    const key = queryKeys.suggestions({
      diet: DietType.KETO,
      cuisine: CuisineType.ITALIAN,
    })
    expect(key[0]).toEqual({
      resource: 'suggestions',
      scope: 'list',
      data: { diet: DietType.KETO, cuisine: CuisineType.ITALIAN },
    })
  })

  it('isolates recipe list and detail caches', () => {
    expect(queryKeys.recipes.list({ kcalMin: 200 })[0].scope).toBe('list')
    expect(queryKeys.recipes.detail('abc')[0].data).toEqual({ id: 'abc' })
  })

  it('uses stable pantry and shopping-list keys', () => {
    expect(queryKeys.pantry()[0].resource).toBe('pantry')
    expect(queryKeys.shoppingList()[0].resource).toBe('shopping-list')
  })

  it('keys ingredient search and external catalog by query', () => {
    expect(queryKeys.ingredients('mąka')[0]).toEqual({
      resource: 'ingredients',
      scope: 'search',
      data: { search: 'mąka' },
    })
    expect(queryKeys.externalRecipes('tofu')[0].data).toEqual({ q: 'tofu' })
  })
})
