import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deletePantryItem, getPantry, upsertPantryItem } from '@/api/pantry'
import { PantryItemRow } from '@/components/domain/PantryItemRow'
import { PantryPageHeader } from '@/features/pantry/PantryPageHeader'
import { UpsertPantryItemDialog } from '@/features/pantry/UpsertPantryItemDialog'
import { invalidatePantryDependentQueries } from '@/lib/invalidate-pantry-dependent'
import { queryKeys } from '@/lib/query-keys'
import type { PantryItem } from '@/types/domain'

type UpsertValues = { quantity: number; unit: string; mode?: 'set' | 'add' }

function AddIngredientButton({
  onSubmit,
}: {
  onSubmit: (ingredientId: string, values: UpsertValues) => void
}) {
  return (
    <UpsertPantryItemDialog
      trigger={
        <button type="button" className="pantry-add-btn">
          Dodaj składnik
        </button>
      }
      onSubmit={onSubmit}
    />
  )
}

export function PantryList() {
  const qc = useQueryClient()
  const { data = [], isLoading, isError } = useQuery({
    queryKey: queryKeys.pantry(),
    queryFn: getPantry,
    staleTime: 30_000,
  })

  const upsertMutation = useMutation({
    mutationFn: ({
      ingredientId,
      quantity,
      unit,
      mode = 'set',
    }: {
      ingredientId: string
      quantity: number
      unit: string
      mode?: 'set' | 'add'
    }) => upsertPantryItem(ingredientId, { quantity, unit, mode }),
    onMutate: async ({ ingredientId, quantity, unit, mode = 'set' }) => {
      await qc.cancelQueries({ queryKey: queryKeys.pantry() })
      const prev = qc.getQueryData<PantryItem[]>(queryKeys.pantry())
      qc.setQueryData<PantryItem[]>(queryKeys.pantry(), (old = []) => {
        const idx = old.findIndex((i) => i.ingredientId === ingredientId)
        if (idx >= 0) {
          const copy = [...old]
          const existing = copy[idx]
          const nextQty =
            mode === 'add' ? Number(existing.quantity) + quantity : quantity
          const nextUnit = mode === 'add' ? existing.unit : unit
          copy[idx] = { ...existing, quantity: nextQty, unit: nextUnit }
          return copy
        }
        const next = { id: `opt-${ingredientId}`, ingredientId, quantity, unit } as PantryItem
        return [...old, next]
      })
      return { prev }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKeys.pantry(), ctx.prev)
    },
    onSettled: () => invalidatePantryDependentQueries(qc),
  })

  const deleteMutation = useMutation({
    mutationFn: (ingredientId: string) => deletePantryItem(ingredientId),
    onSettled: () => invalidatePantryDependentQueries(qc),
  })

  function handleAdd(ingredientId: string, values: UpsertValues) {
    upsertMutation.mutate({ ingredientId, ...values, mode: 'add' })
  }

  function handleEdit(ingredientId: string, values: UpsertValues) {
    upsertMutation.mutate({ ingredientId, ...values, mode: 'set' })
  }

  function confirmDelete(item: PantryItem) {
    const name = item.ingredient?.name ?? 'ten składnik'
    if (window.confirm(`Usunąć ${name} ze spiżarni?`)) {
      deleteMutation.mutate(item.ingredientId)
    }
  }

  const addAction = <AddIngredientButton onSubmit={handleAdd} />

  if (isLoading) {
    return (
      <div className="pantry-page" aria-busy="true" aria-label="Ładowanie spiżarni">
        <PantryPageHeader itemCount={0} actions={addAction} />
        <ul className="pantry-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <li key={i}>
              <div className="pantry-skeleton-card" />
            </li>
          ))}
        </ul>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="pantry-page">
        <PantryPageHeader itemCount={0} actions={addAction} />
        <p className="pantry-error" role="alert">
          Nie udało się wczytać spiżarni.
        </p>
      </div>
    )
  }

  return (
    <div className="pantry-page">
      <PantryPageHeader itemCount={data.length} actions={addAction} />

      {data.length === 0 ? (
        <div className="pantry-shelf-empty" role="status">
          <p className="pantry-shelf-empty__title">Półki są puste</p>
          <p className="pantry-shelf-empty__hint">
            Dodaj składnik powyżej - wtedy pojawią się dopasowane przepisy w sugestiach.
          </p>
        </div>
      ) : (
        <ul className="pantry-grid" aria-label="Składniki w spiżarni">
          {data.map((item) => (
            <PantryItemRow
              key={item.id}
              item={item}
              editTrigger={
                <UpsertPantryItemDialog
                  item={item}
                  trigger={
                    <button type="button" className="pantry-card__btn">
                      Edytuj
                    </button>
                  }
                  onSubmit={handleEdit}
                />
              }
              onDelete={confirmDelete}
            />
          ))}
        </ul>
      )}
    </div>
  )
}
