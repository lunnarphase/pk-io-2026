import { useState } from 'react'
import { LinkIngredientNutritionDialog } from '@/features/nutrition/LinkIngredientNutritionDialog'
import {
  formatIngredientKcal,
  hasIngredientKcal,
  normalizeIngredient,
} from '@/lib/ingredient-nutrition'
import type { Ingredient } from '@/types/domain'

interface IngredientNutritionBadgeProps {
  ingredient: Ingredient
  onIngredientUpdate: (ingredient: Ingredient) => void
}

export function IngredientNutritionBadge({
  ingredient,
  onIngredientUpdate,
}: IngredientNutritionBadgeProps) {
  const [open, setOpen] = useState(false)
  const normalized = normalizeIngredient(ingredient)

  if (hasIngredientKcal(normalized)) {
    return (
      <span className="ingredient-nutrition ingredient-nutrition--linked">
        {formatIngredientKcal(normalized)}
      </span>
    )
  }

  return (
    <>
      <button
        type="button"
        className="ingredient-nutrition ingredient-nutrition--missing"
        onClick={() => setOpen(true)}
      >
        Pobierz kalorykę
      </button>
      <LinkIngredientNutritionDialog
        ingredient={normalized}
        open={open}
        onOpenChange={setOpen}
        onLinked={(updated) => onIngredientUpdate(normalizeIngredient(updated))}
      />
    </>
  )
}
