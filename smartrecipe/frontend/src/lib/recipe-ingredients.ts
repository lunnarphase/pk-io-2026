import { normalizeIngredient } from '@/lib/ingredient-nutrition'
import type { RecipeIngredientLine } from '@/types/domain'

/** TypeORM decimal columns arrive as strings - coerce before API calls. */
export function normalizeRecipeIngredientLines(
  lines: RecipeIngredientLine[],
): Pick<RecipeIngredientLine, 'ingredientId' | 'quantity' | 'unit'>[] {
  return lines.map(({ ingredientId, quantity, unit }) => {
    const q = Number(quantity)
    return {
      ingredientId,
      quantity: Number.isFinite(q) && q > 0 ? q : 1,
      unit,
    }
  })
}

export function normalizeIngredientLine(
  line: RecipeIngredientLine,
): RecipeIngredientLine {
  const q = Number(line.quantity)
  return {
    ...line,
    quantity: Number.isFinite(q) && q > 0 ? q : 1,
    ingredient: line.ingredient ? normalizeIngredient(line.ingredient) : line.ingredient,
  }
}
