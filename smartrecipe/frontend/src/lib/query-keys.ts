import type { CuisineType, DietType } from '@/types/domain'

export const queryKeys = {
  suggestions: (filters?: { diet?: DietType; cuisine?: CuisineType }) =>
    [{ resource: 'suggestions', scope: 'list', data: filters }] as const,
  recipes: {
    list: (filters?: {
      diet?: DietType
      cuisine?: CuisineType
      kcalMin?: number
      kcalMax?: number
    }) => [{ resource: 'recipes', scope: 'list', data: filters }] as const,
    detail: (id: string) => [{ resource: 'recipes', scope: 'detail', data: { id } }] as const,
  },
  pantry: () => [{ resource: 'pantry', scope: 'list' }] as const,
  shoppingList: () => [{ resource: 'shopping-list', scope: 'active' }] as const,
  ingredients: (search: string) =>
    [{ resource: 'ingredients', scope: 'search', data: { search } }] as const,
  externalRecipes: (q: string) =>
    [{ resource: 'external-recipes', scope: 'search', data: { q } }] as const,
}
