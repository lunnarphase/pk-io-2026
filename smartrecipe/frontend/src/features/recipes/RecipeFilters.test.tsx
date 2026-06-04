import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { RecipeFilters } from '@/features/recipes/RecipeFilters'
import { CuisineType, DietType } from '@/types/domain'
import { renderWithProviders } from '@/test/test-utils'

vi.mock('@/components/ui/combobox', async () => {
  const { MockCombobox } = await import('@/test/mock-combobox')
  return { Combobox: MockCombobox }
})

describe('RecipeFilters', () => {
  it('updates diet filter in values', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    renderWithProviders(<RecipeFilters values={{}} onChange={onChange} />)
    await user.selectOptions(screen.getByLabelText('Dieta'), DietType.VEGETARIAN)
    expect(onChange).toHaveBeenCalledWith({ diet: DietType.VEGETARIAN })
  })

  it('clears all filters', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    renderWithProviders(
      <RecipeFilters
        values={{ diet: DietType.KETO, cuisine: CuisineType.POLISH, kcalMin: 100 }}
        onChange={onChange}
      />,
    )
    await user.click(screen.getByRole('button', { name: /Wyczyść filtry/i }))
    expect(onChange).toHaveBeenCalledWith({})
  })

  it('updates kcal min bound', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    renderWithProviders(<RecipeFilters values={{}} onChange={onChange} />)
    const minInput = screen.getByLabelText('kcal min')
    await user.clear(minInput)
    await user.type(minInput, '250')
    expect(onChange).toHaveBeenCalled()
  })
})
