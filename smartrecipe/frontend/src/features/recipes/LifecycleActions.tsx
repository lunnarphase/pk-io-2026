import { useMutation, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { toast } from 'sonner'
import { recipeLifecycle } from '@/api/recipes'
import { Button } from '@/components/ui/button'
import { RecipeLifecycleStatus, type Recipe } from '@/types/domain'

interface LifecycleActionsProps {
  recipe: Recipe
}

export function LifecycleActions({ recipe }: LifecycleActionsProps) {
  const qc = useQueryClient()

  const mutation = useMutation({
    mutationFn: (action: 'publish' | 'archive' | 'unarchive' | 'draft') =>
      recipeLifecycle(recipe.id, action),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [{ resource: 'recipes' }] })
      toast.success('Status przepisu zaktualizowany')
    },
    onError: (err) => {
      if (isAxiosError(err) && err.response?.status === 422) {
        toast.error('Niedozwolone przejście statusu (422)')
        return
      }
      toast.error('Nie udało się zmienić statusu')
    },
  })

  const status = recipe.lifecycleStatus

  return (
    <div className="recipe-editor__lifecycle">
      {status === RecipeLifecycleStatus.DRAFT ? (
        <Button
          type="button"
          className="recipe-editor__toolbar-publish"
          onClick={() => mutation.mutate('publish')}
          disabled={mutation.isPending}
        >
          Opublikuj
        </Button>
      ) : null}
      {status === RecipeLifecycleStatus.ACTIVE ? (
        <>
          <Button type="button" variant="outline" onClick={() => mutation.mutate('draft')} disabled={mutation.isPending}>
            Cofnij do szkicu
          </Button>
          <Button type="button" variant="outline" onClick={() => mutation.mutate('archive')} disabled={mutation.isPending}>
            Archiwizuj
          </Button>
        </>
      ) : null}
      {status === RecipeLifecycleStatus.ARCHIVED ? (
        <Button type="button" onClick={() => mutation.mutate('unarchive')} disabled={mutation.isPending}>
          Przywróć
        </Button>
      ) : null}
    </div>
  )
}
