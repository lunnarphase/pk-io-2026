import { useFillShoppingListFromRecipes } from '@/features/shopping-list/useFillShoppingListFromRecipes'

interface AddRecipeToShoppingListButtonProps {
  recipeId: string
  className?: string
  label?: string
  pendingLabel?: string
}

export function AddRecipeToShoppingListButton({
  recipeId,
  className = 'recipe-detail-view__shop-btn',
  label = 'Dodaj braki do listy zakupów',
  pendingLabel = 'Dodawanie...',
}: AddRecipeToShoppingListButtonProps) {
  const mutation = useFillShoppingListFromRecipes()

  return (
    <button
      type="button"
      className={className}
      disabled={mutation.isPending}
      onClick={() => mutation.mutate([recipeId])}
    >
      {mutation.isPending ? pendingLabel : label}
    </button>
  )
}
