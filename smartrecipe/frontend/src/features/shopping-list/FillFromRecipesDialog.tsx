import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { listRecipes } from '@/api/recipes'
import { useFillShoppingListFromRecipes } from '@/features/shopping-list/useFillShoppingListFromRecipes'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { queryKeys } from '@/lib/query-keys'
import { RecipeLifecycleStatus } from '@/types/domain'

interface FillFromRecipesDialogProps {
  trigger: React.ReactNode
}

export function FillFromRecipesDialog({ trigger }: FillFromRecipesDialogProps) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  const { data: recipes = [] } = useQuery({
    queryKey: queryKeys.recipes.list(),
    queryFn: () => listRecipes(),
    enabled: open,
    staleTime: 120_000,
  })

  const active = recipes.filter((r) => r.lifecycleStatus === RecipeLifecycleStatus.ACTIVE)

  const mutation = useFillShoppingListFromRecipes()

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectedCount = selected.size

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (v) setSelected(new Set())
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="fill-recipes-dialog">
        <DialogHeader className="fill-recipes-dialog__header mb-0 gap-0">
          <DialogTitle className="fill-recipes-dialog__title">Dodaj braki z przepisów</DialogTitle>
          <p className="fill-recipes-dialog__lede">
            Zaznacz przepisy - brakujące składniki trafią na listę zakupów.
          </p>
        </DialogHeader>

        <div className="fill-recipes-dialog__list-wrap">
          {active.length === 0 ? (
            <p className="fill-recipes-dialog__empty">Brak aktywnych przepisów.</p>
          ) : (
            <ul className="fill-recipes-dialog__list">
              {active.map((r) => {
                const isSelected = selected.has(r.id)
                return (
                  <li key={r.id}>
                    <label
                      htmlFor={`fill-recipe-${r.id}`}
                      className={`fill-recipes-dialog__option${isSelected ? ' fill-recipes-dialog__option--selected' : ''}`}
                    >
                      <Checkbox
                        id={`fill-recipe-${r.id}`}
                        className="fill-recipes-dialog__check"
                        checked={isSelected}
                        onCheckedChange={() => toggle(r.id)}
                      />
                      <span className="fill-recipes-dialog__option-title">{r.title}</span>
                    </label>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <footer className="fill-recipes-dialog__footer">
          <p className="fill-recipes-dialog__meta">
            Wybrano: <strong>{selectedCount}</strong>{' '}
            {selectedCount === 1 ? 'przepis' : selectedCount < 5 ? 'przepisy' : 'przepisów'}
          </p>
          <button
            type="button"
            className="fill-recipes-dialog__submit"
            disabled={selectedCount === 0 || mutation.isPending}
            onClick={() =>
              mutation.mutate([...selected], {
                onSuccess: () => setOpen(false),
              })
            }
          >
            {mutation.isPending ? 'Uzupełnianie...' : 'Uzupełnij listę zakupów'}
          </button>
        </footer>
      </DialogContent>
    </Dialog>
  )
}
