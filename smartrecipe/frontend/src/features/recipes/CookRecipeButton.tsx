import { useCookRecipe } from '@/features/recipes/useCookRecipe'

interface CookRecipeButtonProps {
  recipeId: string
  className?: string
}

export function CookRecipeButton({
  recipeId,
  className = 'recipe-detail-view__cook-btn',
}: CookRecipeButtonProps) {
  const mutation = useCookRecipe(recipeId)

  return (
    <button
      type="button"
      className={className}
      disabled={mutation.isPending}
      onClick={() => mutation.mutate()}
    >
      {mutation.isPending ? 'Odejmowanie...' : 'Ugotowałem!'}
    </button>
  )
}
