import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { IngredientNutritionBadge } from '@/features/nutrition/IngredientNutritionBadge'
import { renderWithProviders } from '@/test/test-utils'

vi.mock('@/features/nutrition/LinkIngredientNutritionDialog', () => ({
  LinkIngredientNutritionDialog: ({
    open,
    onOpenChange,
  }: {
    open: boolean
    onOpenChange: (open: boolean) => void
  }) =>
    open ? (
      <div role="dialog">
        <button type="button" onClick={() => onOpenChange(false)}>
          Zamknij dialog
        </button>
      </div>
    ) : null,
}))

describe('IngredientNutritionBadge', () => {
  it('shows kcal label when ingredient has nutrition data', () => {
    renderWithProviders(
      <IngredientNutritionBadge
        ingredient={{ id: '1', name: 'Ryż', kcalPer100g: 130 }}
        onIngredientUpdate={vi.fn()}
      />,
    )
    expect(screen.getByText('130 kcal / 100 g')).toBeInTheDocument()
  })

  it('opens link dialog when kcal is missing', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <IngredientNutritionBadge
        ingredient={{ id: '1', name: 'Sól' }}
        onIngredientUpdate={vi.fn()}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Pobierz kalorykę' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})
