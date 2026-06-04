import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AddRecipeToShoppingListButton } from '@/features/recipes/AddRecipeToShoppingListButton'
import { renderWithProviders } from '@/test/test-utils'

const mutate = vi.fn()

vi.mock('@/features/shopping-list/useFillShoppingListFromRecipes', () => ({
  useFillShoppingListFromRecipes: () => ({
    mutate,
    isPending: false,
  }),
}))

describe('AddRecipeToShoppingListButton', () => {
  it('passes recipe id to fill mutation', async () => {
    mutate.mockClear()
    const user = userEvent.setup()
    renderWithProviders(
      <AddRecipeToShoppingListButton recipeId="recipe-99" label="Dodaj braki" />,
    )
    await user.click(screen.getByRole('button', { name: 'Dodaj braki' }))
    expect(mutate).toHaveBeenCalledWith(['recipe-99'])
  })
})
