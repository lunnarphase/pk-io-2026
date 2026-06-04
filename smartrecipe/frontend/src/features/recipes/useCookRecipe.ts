import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { cookRecipe } from '@/api/recipes'
import { invalidatePantryDependentQueries } from '@/lib/invalidate-pantry-dependent'

export function useCookRecipe(recipeId: string) {
  const navigate = useNavigate()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: () => cookRecipe(recipeId),
    onSuccess: () => {
      invalidatePantryDependentQueries(qc)
      toast.success('Składniki odjęte ze spiżarni', {
        action: {
          label: 'Spiżarnia',
          onClick: () => navigate('/pantry'),
        },
      })
    },
    onError: () => toast.error('Nie udało się odjąć składników ze spiżarni'),
  })
}
