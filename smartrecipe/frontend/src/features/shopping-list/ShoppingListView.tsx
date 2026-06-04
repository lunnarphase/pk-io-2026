import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  clearShoppingList,
  deleteShoppingItem,
  getShoppingList,
  patchShoppingItem,
  syncPurchasedToPantry,
} from '@/api/shopping-list'
import { ShoppingItemRow } from '@/components/domain/ShoppingItemRow'
import { AddItemDialog } from '@/features/shopping-list/AddItemDialog'
import { FillFromRecipesDialog } from '@/features/shopping-list/FillFromRecipesDialog'
import { ShoppingListPageHeader } from '@/features/shopping-list/ShoppingListPageHeader'
import { invalidatePantryDependentQueries } from '@/lib/invalidate-pantry-dependent'
import { queryKeys } from '@/lib/query-keys'
import type { ShoppingList } from '@/types/domain'

function sortItems(items: ShoppingList['items']) {
  return [...items].sort((a, b) => {
    if (a.purchased !== b.purchased) return a.purchased ? 1 : -1
    const na = a.ingredient?.name ?? a.ingredientId
    const nb = b.ingredient?.name ?? b.ingredientId
    return na.localeCompare(nb, 'pl')
  })
}

export function ShoppingListView() {
  const qc = useQueryClient()

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.shoppingList(),
    queryFn: getShoppingList,
    staleTime: 20_000,
  })

  const invalidateListAndPantry = () => {
    void qc.invalidateQueries({ queryKey: [{ resource: 'shopping-list' }] })
    invalidatePantryDependentQueries(qc)
  }

  const toggleMutation = useMutation({
    mutationFn: ({ id, purchased }: { id: string; purchased: boolean }) =>
      patchShoppingItem(id, { purchased }),
    onMutate: async ({ id, purchased }) => {
      await qc.cancelQueries({ queryKey: queryKeys.shoppingList() })
      const prev = qc.getQueryData<ShoppingList>(queryKeys.shoppingList())
      qc.setQueryData<ShoppingList>(queryKeys.shoppingList(), (old) => {
        if (!old) return old
        return {
          ...old,
          items: old.items.map((i) => (i.id === id ? { ...i, purchased } : i)),
        }
      })
      return { prev }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKeys.shoppingList(), ctx.prev)
      toast.error('Nie udało się zaktualizować pozycji')
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: [{ resource: 'shopping-list' }] }),
  })

  const syncMutation = useMutation({
    mutationFn: syncPurchasedToPantry,
    onError: () => toast.error('Nie udało się zsynchronizować ze spiżarnią'),
    onSettled: invalidateListAndPantry,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteShoppingItem(id),
    onError: () => toast.error('Nie udało się usunąć pozycji'),
    onSettled: () => void qc.invalidateQueries({ queryKey: [{ resource: 'shopping-list' }] }),
  })

  const clearMutation = useMutation({
    mutationFn: clearShoppingList,
    onSuccess: () => {
      toast.success('Lista zakupów wyczyszczona')
      qc.setQueryData<ShoppingList>(queryKeys.shoppingList(), (old) =>
        old ? { ...old, items: [] } : old,
      )
    },
    onError: () => toast.error('Nie udało się wyczyścić listy'),
    onSettled: () => void qc.invalidateQueries({ queryKey: [{ resource: 'shopping-list' }] }),
  })

  const handleClearList = () => {
    if (!window.confirm('Usunąć wszystkie pozycje z listy zakupów?')) return
    clearMutation.mutate()
  }

  const items = data?.items ?? []
  const pendingCount = items.filter((i) => !i.purchased).length
  const purchasedCount = items.filter((i) => i.purchased).length
  const sorted = sortItems(items)

  const handleSyncPantry = () => {
    if (purchasedCount === 0) return
    const synced = purchasedCount
    syncMutation.mutate(undefined, {
      onSuccess: (list) => {
        qc.setQueryData(queryKeys.shoppingList(), list)
        toast.success(
          synced === 1
            ? '1 pozycja dodana do spiżarni'
            : `${synced} pozycje dodane do spiżarni`,
        )
      },
    })
  }
  const rowBusy =
    toggleMutation.isPending ||
    syncMutation.isPending ||
    deleteMutation.isPending ||
    clearMutation.isPending

  const toolbar = (
    <>
      <div className="shopping-toolbar__primary">
        <FillFromRecipesDialog
          trigger={
            <button type="button" className="shopping-btn shopping-btn--outline">
              Z przepisów
            </button>
          }
        />
        <AddItemDialog
          trigger={
            <button type="button" className="shopping-btn shopping-btn--primary">
              Dodaj ręcznie
            </button>
          }
        />
        {purchasedCount > 0 ? (
          <button
            type="button"
            className="shopping-btn shopping-btn--sync"
            disabled={syncMutation.isPending}
            onClick={handleSyncPantry}
          >
            {syncMutation.isPending
              ? 'Synchronizowanie...'
              : `Synchronizuj kupione ze spiżarnią (${purchasedCount})`}
          </button>
        ) : null}
      </div>
      {items.length > 0 ? (
        <button
          type="button"
          className="shopping-toolbar__clear"
          disabled={clearMutation.isPending}
          onClick={handleClearList}
        >
          {clearMutation.isPending ? 'Czyszczenie...' : 'Wyczyść listę'}
        </button>
      ) : null}
    </>
  )

  if (isLoading) {
    return (
      <div className="shopping-page">
        <ShoppingListPageHeader pendingCount={0} purchasedCount={0} toolbar={toolbar} />
        <div className="shopping-skeleton" aria-busy="true" aria-label="Wczytywanie listy" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="shopping-page">
        <ShoppingListPageHeader pendingCount={0} purchasedCount={0} toolbar={toolbar} />
        <p className="shopping-error" role="alert">
          Nie udało się wczytać listy zakupów.
        </p>
      </div>
    )
  }

  return (
    <div className="shopping-page">
      <ShoppingListPageHeader
        pendingCount={pendingCount}
        purchasedCount={purchasedCount}
        toolbar={toolbar}
      />

      {items.length === 0 ? (
        <div className="shopping-empty">
          <p className="shopping-empty__title">Lista jest pusta</p>
          <p className="shopping-empty__lede">
            Uzupełnij brakujące składniki z przepisów albo dodaj pozycję ręcznie.
          </p>
        </div>
      ) : (
        <div className="shopping-panel">
          <ul className="shopping-list">
            {sorted.map((item) => (
              <ShoppingItemRow
                key={item.id}
                item={item}
                disabled={rowBusy}
                onToggle={(row, purchased) =>
                  toggleMutation.mutate({ id: row.id, purchased })
                }
                onDelete={(row) => deleteMutation.mutate(row.id)}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
