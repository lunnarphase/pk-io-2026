import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { fillShoppingList } from '@/api/shopping-list'

export function useFillShoppingListFromRecipes() {
  const navigate = useNavigate()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (recipeIds: string[]) => fillShoppingList(recipeIds),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [{ resource: 'shopping-list' }] })
      toast.success('Brakujące składniki dodane do listy zakupów', {
        action: {
          label: 'Zobacz listę',
          onClick: () => navigate('/shopping-list'),
        },
      })
    },
    onError: () => toast.error('Nie udało się uzupełnić listy zakupów'),
  })
}
