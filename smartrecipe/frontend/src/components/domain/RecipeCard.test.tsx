import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { RecipeCard } from '@/components/domain/RecipeCard'
import {
  CuisineType,
  DietType,
  RecipeLifecycleStatus,
  type Recipe,
} from '@/types/domain'
import { renderWithProviders } from '@/test/test-utils'

const recipe: Recipe = {
  id: 'r1',
  title: 'Risotto',
  instructions: null,
  estimatedKcalPerServing: 420,
  servings: 2,
  lifecycleStatus: RecipeLifecycleStatus.ACTIVE,
  dietType: DietType.VEGETARIAN,
  cuisineType: CuisineType.ITALIAN,
}

describe('RecipeCard', () => {
  it('renders title link and metadata badges', () => {
    renderWithProviders(<RecipeCard recipe={recipe} />)
    expect(screen.getByRole('link', { name: 'Risotto' })).toHaveAttribute(
      'href',
      '/recipes/r1',
    )
    expect(screen.getByText('Wegetariańska')).toBeInTheDocument()
    expect(screen.getByText('Włoska')).toBeInTheDocument()
    expect(screen.getByText('420 kcal')).toBeInTheDocument()
  })

  it('shows missing ingredient count when provided', () => {
    renderWithProviders(<RecipeCard recipe={recipe} missingCount={2} />)
    expect(screen.getByText('Brakuje 2 składników')).toBeInTheDocument()
  })

  it('shows full match badge without missingCount', () => {
    renderWithProviders(<RecipeCard recipe={recipe} />)
    expect(screen.getByText('100% składników')).toBeInTheDocument()
  })
})
