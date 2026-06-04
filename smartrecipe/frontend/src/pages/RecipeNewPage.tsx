import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { createRecipe, setRecipeIngredients } from '@/api/recipes'
import { IngredientListEditor } from '@/features/recipes/IngredientListEditor'
import { RecipeEditorShell } from '@/features/recipes/RecipeEditorShell'
import { RecipeForm, type RecipeFormValues } from '@/features/recipes/RecipeForm'
import type { RecipeIngredientLine } from '@/types/domain'

const FORM_ID = 'recipe-new-form'

export function RecipeNewPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const submitFormRef = useRef<() => void>(() => {})
  const [lines, setLines] = useState<RecipeIngredientLine[]>([])

  const mutation = useMutation({
    mutationFn: async (values: RecipeFormValues) => {
      const recipe = await createRecipe({
        title: values.title,
        instructions: values.instructions,
        estimatedKcalPerServing: values.estimatedKcalPerServing || undefined,
        servings: values.servings || undefined,
        dietType: values.dietType,
        cuisineType: values.cuisineType,
      })
      if (lines.length) {
        await setRecipeIngredients(
          recipe.id,
          lines.map(({ ingredientId, quantity, unit }) => ({ ingredientId, quantity, unit })),
        )
      }
      return recipe
    },
    onSuccess: (recipe) => {
      void qc.invalidateQueries({ queryKey: [{ resource: 'recipes' }] })
      navigate(`/recipes/${recipe.id}`)
    },
    onError: () => toast.error('Nie udało się zapisać przepisu'),
  })

  const isPending = mutation.isPending

  return (
    <RecipeEditorShell
      title="Nowy przepis"
      lede="Uzupełnij dane po lewej i składniki po prawej - zapiszesz szkic i wrócisz do edycji w dowolnym momencie."
      main={
        <RecipeForm
          formId={FORM_ID}
          submitPlacement="footer"
          onSubmit={(v) => mutation.mutate(v)}
          isPending={isPending}
          submitLabel="Utwórz szkic"
          onRegisterSubmit={(submit) => {
            submitFormRef.current = submit
          }}
        />
      }
      aside={<IngredientListEditor lines={lines} onChange={setLines} />}
      footer={
        <button
          type="button"
          className="recipe-form__submit recipe-editor__footer-submit"
          disabled={isPending}
          onClick={() => submitFormRef.current()}
        >
          {isPending ? 'Zapisywanie...' : 'Utwórz szkic'}
        </button>
      }
    />
  )
}
