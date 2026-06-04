import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { RecipeListCard } from '@/features/recipes/RecipeListCard'
import {
  CuisineType,
  DietType,
  RecipeLifecycleStatus,
  type Recipe,
} from '@/types/domain'
import { renderWithProviders } from '@/test/test-utils'

const base: Recipe = {
  id: 'r1',
  title: 'Zupa',
  instructions: null,
  estimatedKcalPerServing: 180,
  servings: 2,
  lifecycleStatus: RecipeLifecycleStatus.DRAFT,
  dietType: DietType.VEGETARIAN,
  cuisineType: CuisineType.POLISH,
}

describe('RecipeListCard', () => {
  it('renders title, status and ingredient names', () => {
    renderWithProviders(
      <RecipeListCard
        recipe={{
          ...base,
          ingredients: [
            {
              ingredientId: 'i1',
              quantity: 1,
              unit: 'kg',
              ingredient: { id: 'i1', name: 'Marchew' },
            },
            {
              ingredientId: 'i2',
              quantity: 2,
              unit: 'szt',
              ingredient: { id: 'i2', name: 'Cebula' },
            },
          ],
        }}
      />,
    )
    expect(screen.getByRole('link', { name: /Zupa/i })).toHaveAttribute('href', '/recipes/r1')
    expect(screen.getByText('Szkic')).toBeInTheDocument()
    expect(screen.getByText('Marchew')).toBeInTheDocument()
    expect(screen.getByText('180 kcal')).toBeInTheDocument()
  })

  it('shows placeholder when recipe has no ingredients', () => {
    renderWithProviders(<RecipeListCard recipe={{ ...base, ingredients: [] }} />)
    expect(screen.getByText('Brak składników')).toBeInTheDocument()
  })

  it('truncates long ingredient lists', () => {
    const ingredients = Array.from({ length: 7 }, (_, i) => ({
      ingredientId: `i${i}`,
      quantity: 1,
      unit: 'g',
      ingredient: { id: `i${i}`, name: `Składnik ${i}` },
    }))
    renderWithProviders(<RecipeListCard recipe={{ ...base, ingredients }} />)
    expect(screen.getByText('+2 więcej')).toBeInTheDocument()
  })
})
