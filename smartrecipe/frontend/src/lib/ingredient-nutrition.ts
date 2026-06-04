import type { Ingredient } from '@/types/domain'

/** API / TypeORM may return decimal kcal as string. */
function parseOptionalNumber(raw: unknown): number | null {
  if (raw == null || raw === ('' as unknown as number)) return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

export function normalizeIngredient(ingredient: Ingredient): Ingredient {
  return {
    ...ingredient,
    kcalPer100g: parseOptionalNumber(ingredient.kcalPer100g),
    gramsPerPiece: parseOptionalNumber(ingredient.gramsPerPiece),
    externalFoodId: ingredient.externalFoodId ?? null,
  }
}

export function hasIngredientKcal(ingredient: Ingredient): boolean {
  return ingredient.kcalPer100g != null && Number.isFinite(ingredient.kcalPer100g)
}

export function formatIngredientKcal(ingredient: Ingredient): string {
  if (!hasIngredientKcal(ingredient)) return ''
  return `${Math.round(Number(ingredient.kcalPer100g))} kcal / 100 g`
}
