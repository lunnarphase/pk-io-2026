import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SuggestionsTabs } from '@/features/suggestions/SuggestionsTabs'
import { RecipeLifecycleStatus, type Recipe } from '@/types/domain'
import { renderWithProviders } from '@/test/test-utils'

vi.mock('@/features/recipes/AddRecipeToShoppingListButton', () => ({
  AddRecipeToShoppingListButton: () => <button type="button">Dodaj na listę</button>,
}))

vi.mock('@/features/suggestions/SuggestionRecipeRow', () => ({
  SuggestionRecipeRow: ({ recipe }: { recipe: Recipe }) => (
    <div data-testid="recipe-row">{recipe.title}</div>
  ),
}))

function activeRecipe(id: string, title: string): Recipe {
  return {
    id,
    title,
    instructions: null,
    estimatedKcalPerServing: null,
    servings: null,
    lifecycleStatus: RecipeLifecycleStatus.ACTIVE,
    dietType: null,
    cuisineType: null,
  }
}

describe('SuggestionsTabs (UC03 suggestion buckets)', () => {
  it('renders tab counts and ready recipes', () => {
    renderWithProviders(
      <SuggestionsTabs
        activeTab="ready"
        onTabChange={vi.fn()}
        available={[activeRecipe('1', 'Omlet')]}
        almostAvailable={[]}
        needsMore={[]}
      />,
    )
    expect(screen.getByRole('tab', { name: /Ze spiżarni/i })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getByTestId('recipe-row')).toHaveTextContent('Omlet')
  })

  it('switches tab via onTabChange', async () => {
    const onTabChange = vi.fn()
    const user = userEvent.setup()
    renderWithProviders(
      <SuggestionsTabs
        activeTab="ready"
        onTabChange={onTabChange}
        available={[]}
        almostAvailable={[
          { recipe: activeRecipe('2', 'Pizza'), missingCount: 1 },
        ]}
        needsMore={[]}
      />,
    )
    await user.click(screen.getByRole('tab', { name: /Lekkie braki/i }))
    expect(onTabChange).toHaveBeenCalledWith('almost')
  })

  it('renders almost-available recipes with missing count', () => {
    renderWithProviders(
      <SuggestionsTabs
        activeTab="almost"
        onTabChange={vi.fn()}
        available={[]}
        almostAvailable={[
          { recipe: activeRecipe('2', 'Pizza'), missingCount: 2 },
        ]}
        needsMore={[]}
      />,
    )
    expect(screen.getByTestId('recipe-row')).toHaveTextContent('Pizza')
  })

  it('shows empty state for active tab without recipes', () => {
    renderWithProviders(
      <SuggestionsTabs
        activeTab="needs-more"
        onTabChange={vi.fn()}
        available={[]}
        almostAvailable={[]}
        needsMore={[]}
      />,
    )
    expect(
      screen.getByText(/więcej niż dwóch brakujących składników/i),
    ).toBeInTheDocument()
  })
})
