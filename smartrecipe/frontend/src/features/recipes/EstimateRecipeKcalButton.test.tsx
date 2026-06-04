import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { EstimateRecipeKcalButton } from '@/features/recipes/EstimateRecipeKcalButton'
import { toast } from 'sonner'
import { estimateRecipeKcal } from '@/api/recipes'
import { renderWithProviders } from '@/test/test-utils'

vi.mock('@/api/recipes', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/recipes')>()
  return {
    ...actual,
    estimateRecipeKcal: vi.fn(),
  }
})

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}))

describe('EstimateRecipeKcalButton (draft estimateKcal / RF17)', () => {
  beforeEach(() => {
    vi.mocked(estimateRecipeKcal).mockReset()
  })

  it('is disabled without ingredient lines', () => {
    renderWithProviders(
      <EstimateRecipeKcalButton
        recipeId="r1"
        lines={[]}
        onEstimated={vi.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: 'Oblicz kcal' })).toBeDisabled()
  })

  it('prefills servings from resolveDefaultServings when dialog opens', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <EstimateRecipeKcalButton
        recipeId="r1"
        lines={[{ ingredientId: 'i1', quantity: 100, unit: 'g' }]}
        resolveDefaultServings={() => 4}
        onEstimated={vi.fn()}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Oblicz kcal' }))
    expect(screen.getByLabelText('Liczba porcji')).toHaveValue(4)
  })

  it('calls estimateRecipeKcal with parsed servings', async () => {
    const onEstimated = vi.fn()
    vi.mocked(estimateRecipeKcal).mockResolvedValue({
      servings: 2,
      totalKcal: 600,
      estimatedKcalPerServing: 300,
      includedCount: 1,
      skipped: [],
    })
    const user = userEvent.setup()
    renderWithProviders(
      <EstimateRecipeKcalButton
        recipeId="r1"
        lines={[{ ingredientId: 'i1', quantity: 200, unit: 'g' }]}
        onEstimated={onEstimated}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Oblicz kcal' }))
    await user.click(screen.getByRole('button', { name: 'Oblicz' }))
    expect(estimateRecipeKcal).toHaveBeenCalledWith('r1', {
      servings: 1,
      ingredients: [{ ingredientId: 'i1', quantity: 200, unit: 'g' }],
    })
    expect(onEstimated).toHaveBeenCalled()
  })

  it('shows info toast when some ingredients were skipped', async () => {
    vi.mocked(estimateRecipeKcal).mockResolvedValue({
      servings: 2,
      totalKcal: 400,
      estimatedKcalPerServing: 200,
      includedCount: 1,
      skipped: [{ ingredientId: 'i2', name: 'Sól', reason: 'no_kcal_data' }],
    })
    const user = userEvent.setup()
    renderWithProviders(
      <EstimateRecipeKcalButton
        recipeId="r1"
        lines={[{ ingredientId: 'i1', quantity: 100, unit: 'g' }]}
        onEstimated={vi.fn()}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Oblicz kcal' }))
    await user.click(screen.getByRole('button', { name: 'Oblicz' }))
    expect(toast.info).toHaveBeenCalled()
  })
})
