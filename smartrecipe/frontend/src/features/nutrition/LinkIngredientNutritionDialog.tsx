import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import {
  enrichIngredientAuto,
  enrichIngredientByFdc,
  searchNutritionFoods,
} from '@/api/nutrition'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useDebounce } from '@/hooks/useDebounce'
import {
  formatIngredientKcal,
  hasIngredientKcal,
  normalizeIngredient,
} from '@/lib/ingredient-nutrition'
import type { Ingredient } from '@/types/domain'
import { toast } from 'sonner'

interface LinkIngredientNutritionDialogProps {
  ingredient: Ingredient
  open: boolean
  onOpenChange: (open: boolean) => void
  onLinked: (ingredient: Ingredient) => void
}

function handleEnrichResult(
  updated: Ingredient,
  onLinked: (ingredient: Ingredient) => void,
  onOpenChange: (open: boolean) => void,
) {
  const normalized = normalizeIngredient(updated)
  if (!hasIngredientKcal(normalized)) {
    toast.error('Nie znaleziono kaloryki dla tego składnika - wybierz inną pozycję z listy.')
    return
  }
  onLinked(normalized)
  toast.success(`Zapisano: ${formatIngredientKcal(normalized)}`)
  onOpenChange(false)
}

export function LinkIngredientNutritionDialog({
  ingredient,
  open,
  onOpenChange,
  onLinked,
}: LinkIngredientNutritionDialogProps) {
  const [manualQuery, setManualQuery] = useState('')
  const debouncedManual = useDebounce(manualQuery, 350)
  const searchTerm = debouncedManual.trim() || ingredient.name

  const { data: hits = [], isFetching, isError } = useQuery({
    queryKey: [{ resource: 'nutrition', scope: 'search', q: searchTerm }],
    queryFn: () => searchNutritionFoods(searchTerm),
    enabled: open && searchTerm.length >= 2,
    staleTime: 60_000,
  })

  const autoMutation = useMutation({
    mutationFn: () => enrichIngredientAuto(ingredient.id),
    onSuccess: (updated) => handleEnrichResult(updated, onLinked, onOpenChange),
    onError: () => toast.error('Nie udało się pobrać kaloryki'),
  })

  const pickMutation = useMutation({
    mutationFn: (fdcId: number) => enrichIngredientByFdc(ingredient.id, fdcId),
    onSuccess: (updated) => handleEnrichResult(updated, onLinked, onOpenChange),
    onError: () => toast.error('Zapis nie powiódł się'),
  })

  const busy = autoMutation.isPending || pickMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="nutrition-dialog">
        <DialogHeader>
          <DialogTitle className="nutrition-dialog__title">
            Kaloryka - {ingredient.name}
          </DialogTitle>
          <p className="nutrition-dialog__lede">
            Szukamy wartości na 100 g w bazie żywności. Polskie nazwy tłumaczymy
            przez DeepL - możesz też wpisać własną frazę po angielsku (np. „wheat flour”).
          </p>
        </DialogHeader>

        <div className="nutrition-dialog__actions">
          <Button
            type="button"
            size="sm"
            disabled={busy}
            onClick={() => autoMutation.mutate()}
          >
            {autoMutation.isPending ? 'Pobieram...' : 'Pobierz automatycznie'}
          </Button>
        </div>

        <label className="nutrition-dialog__label" htmlFor="nutrition-manual-q">
          Szukaj ręcznie
        </label>
        <input
          id="nutrition-manual-q"
          className="app-input nutrition-dialog__input"
          value={manualQuery}
          onChange={(e) => setManualQuery(e.target.value)}
          placeholder="np. chicken breast, wheat flour"
          autoComplete="off"
        />

        {isError ? (
          <p className="nutrition-dialog__error" role="alert">
            Baza kaloryczna niedostępna - sprawdź konfigurację API w backendzie.
          </p>
        ) : null}

        {isFetching ? <p className="nutrition-dialog__status">Szukam...</p> : null}

        {!isFetching && !isError && hits.length > 0 ? (
          <ul className="nutrition-dialog__hits">
            {hits.map((hit) => (
              <li key={hit.fdcId}>
                <button
                  type="button"
                  className="nutrition-dialog__hit"
                  disabled={busy}
                  onClick={() => pickMutation.mutate(hit.fdcId)}
                >
                  <span className="nutrition-dialog__hit-name">{hit.description}</span>
                  <span className="nutrition-dialog__hit-kcal">
                    {hit.kcalPer100g != null
                      ? `${hit.kcalPer100g} kcal / 100 g`
                      : 'brak danych o kcal'}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {!isFetching && !isError && searchTerm.length >= 2 && hits.length === 0 ? (
          <p className="nutrition-dialog__status">
            Brak wyników - spróbuj innej nazwy (najlepiej po angielsku).
          </p>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
