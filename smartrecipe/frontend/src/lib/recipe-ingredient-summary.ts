import { formatUnit } from '@/lib/utils'
import type { Recipe } from '@/types/domain'

export function recipeIngredientSummary(recipe: Recipe): string {
  const lines = recipe.ingredients ?? []
  if (!lines.length) return 'Brak składników'
  return lines
    .slice(0, 3)
    .map((l) => formatUnit(Number(l.quantity), l.unit))
    .join(' · ')
}
