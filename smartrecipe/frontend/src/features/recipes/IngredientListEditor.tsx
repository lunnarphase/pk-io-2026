import { useState, type Dispatch, type SetStateAction } from 'react'
import { normalizeIngredient } from '@/lib/ingredient-nutrition'
import { Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { IngredientCombobox } from '@/components/domain/IngredientCombobox'
import { UnitCombobox } from '@/components/domain/UnitCombobox'
import { IngredientNutritionBadge } from '@/features/nutrition/IngredientNutritionBadge'
import { DEFAULT_UNIT, NO_UNIT } from '@/lib/unit-options'
import type { Ingredient, RecipeIngredientLine } from '@/types/domain'

interface IngredientListEditorProps {
  lines: RecipeIngredientLine[]
  onChange: Dispatch<SetStateAction<RecipeIngredientLine[]>>
}

export function IngredientListEditor({ lines, onChange }: IngredientListEditorProps) {
  const [picker, setPicker] = useState<Ingredient | null>(null)

  function addLine(ingredient: Ingredient) {
    if (lines.some((l) => l.ingredientId === ingredient.id)) return
    const normalized = normalizeIngredient(ingredient)
    onChange((prev) => [
      ...prev,
      {
        ingredientId: normalized.id,
        quantity: 1,
        unit: DEFAULT_UNIT,
        ingredient: normalized,
      },
    ])
  }

  function updateLine(index: number, patch: Partial<RecipeIngredientLine>) {
    const next = [...lines]
    next[index] = { ...next[index], ...patch }
    onChange(next)
  }

  function removeLine(index: number) {
    onChange(lines.filter((_, i) => i !== index))
  }

  function updateIngredientOnLine(ingredient: Ingredient) {
    const normalized = normalizeIngredient(ingredient)
    onChange((prev) =>
      prev.map((line) =>
        line.ingredientId === normalized.id ? { ...line, ingredient: normalized } : line,
      ),
    )
  }

  return (
    <div className="recipe-ingredients">
      <IngredientCombobox
        value={picker}
        onChange={(ing) => {
          if (ing) {
            addLine(ing)
            setPicker(null)
          } else {
            setPicker(null)
          }
        }}
        label="Dodaj składnik"
      />

      {lines.length === 0 ? (
        <p className="recipe-ingredients__empty" role="status">
          Jeszcze bez składników - wyszukaj powyżej, aby dodać pierwszy.
        </p>
      ) : (
        <div className="recipe-ingredients__table">
          <div className="recipe-ingredients__cols" aria-hidden="true">
            <span className="recipe-ingredients__col">Składnik</span>
            <span className="recipe-ingredients__col">kcal / 100 g</span>
            <span className="recipe-ingredients__col">Ilość</span>
            <span className="recipe-ingredients__col">Jednostka</span>
            <span />
          </div>
          <ul className="recipe-ingredients__list">
            {lines.map((line, i) => (
              <li key={line.ingredientId} className="recipe-ingredient-line">
                <span className="recipe-ingredient-line__name">
                  {line.ingredient?.name ?? line.ingredientId}
                </span>
                {line.ingredient ? (
                  <IngredientNutritionBadge
                    ingredient={line.ingredient}
                    onIngredientUpdate={updateIngredientOnLine}
                  />
                ) : (
                  <span className="ingredient-nutrition ingredient-nutrition--placeholder" aria-hidden="true" />
                )}
                {line.unit !== NO_UNIT && (
                  <Input
                    type="number"
                    step="any"
                    className="recipe-ingredient-line__qty recipe-form__input"
                    aria-label={`Ilość: ${line.ingredient?.name ?? line.ingredientId}`}
                    value={Number(line.quantity) || ''}
                    onChange={(e) => {
                      const q = parseFloat(e.target.value)
                      updateLine(i, {
                        quantity: Number.isFinite(q) && q > 0 ? q : 1,
                      })
                    }}
                  />
                )}
                <UnitCombobox
                  className="recipe-ingredient-line__unit"
                  value={line.unit}
                  onValueChange={(unit) => updateLine(i, { unit })}
                />
                <button
                  type="button"
                  className="recipe-ingredient-line__remove"
                  aria-label={`Usuń ${line.ingredient?.name ?? line.ingredientId}`}
                  onClick={() => removeLine(i)}
                >
                  <Trash2 size={14} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
