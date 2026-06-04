import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CookRecipeButton } from '@/features/recipes/CookRecipeButton'
import { renderWithProviders } from '@/test/test-utils'

const mutate = vi.fn()

vi.mock('@/features/recipes/useCookRecipe', () => ({
  useCookRecipe: () => ({
    mutate,
    isPending: false,
  }),
}))

describe('CookRecipeButton', () => {
  it('renders cook action and triggers mutation', async () => {
    mutate.mockClear()
    const user = userEvent.setup()
    renderWithProviders(<CookRecipeButton recipeId="r1" />)
    await user.click(screen.getByRole('button', { name: 'Ugotowałem!' }))
    expect(mutate).toHaveBeenCalled()
  })
})
