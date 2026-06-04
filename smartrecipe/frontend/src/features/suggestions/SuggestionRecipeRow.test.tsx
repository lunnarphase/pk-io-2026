import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SuggestionRecipeRow } from '@/features/suggestions/SuggestionRecipeRow'
import { RecipeLifecycleStatus, type Recipe } from '@/types/domain'
import { renderWithProviders } from '@/test/test-utils'

const recipe: Recipe = {
  id: 'r1',
  title: 'Curry',
  instructions: null,
  estimatedKcalPerServing: 400,
  servings: null,
  lifecycleStatus: RecipeLifecycleStatus.ACTIVE,
  dietType: null,
  cuisineType: null,
}

describe('SuggestionRecipeRow', () => {
  it('shows full match when missingCount is omitted', () => {
    renderWithProviders(
      <ul>
        <SuggestionRecipeRow recipe={recipe} />
      </ul>,
    )
    expect(screen.getByText('100% składników')).toBeInTheDocument()
  })

  it('shows missing ingredient count for almost/needs-more variants', () => {
    renderWithProviders(
      <ul>
        <SuggestionRecipeRow recipe={recipe} missingCount={1} variant="almost" />
      </ul>,
    )
    expect(screen.getByText('Brakuje 1 składnika')).toBeInTheDocument()
    expect(screen.queryByText('Brakuje 2 składników')).not.toBeInTheDocument()
  })

  it('applies needs-more row modifier', () => {
    const { container } = renderWithProviders(
      <ul>
        <SuggestionRecipeRow recipe={recipe} missingCount={5} variant="needs-more" />
      </ul>,
    )
    expect(container.querySelector('.suggest-row--needs-more')).toBeInTheDocument()
  })
})
