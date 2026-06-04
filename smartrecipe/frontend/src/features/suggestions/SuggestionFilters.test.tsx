import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SuggestionFilters } from '@/features/suggestions/SuggestionFilters'
import { DietType } from '@/types/domain'
import { renderWithProviders } from '@/test/test-utils'

vi.mock('@/components/ui/combobox', async () => {
  const { MockCombobox } = await import('@/test/mock-combobox')
  return { Combobox: MockCombobox }
})

describe('SuggestionFilters', () => {
  it('calls onDietChange when diet filter changes', async () => {
    const onDietChange = vi.fn()
    const user = userEvent.setup()
    renderWithProviders(
      <SuggestionFilters onDietChange={onDietChange} onCuisineChange={vi.fn()} />,
    )
    await user.selectOptions(document.getElementById('filter-diet')!, DietType.VEGAN)
    expect(onDietChange).toHaveBeenCalledWith(DietType.VEGAN)
  })

  it('shows clear button when filters are active', async () => {
    const onClearAll = vi.fn()
    const user = userEvent.setup()
    renderWithProviders(
      <SuggestionFilters
        diet={DietType.KETO}
        onDietChange={vi.fn()}
        onCuisineChange={vi.fn()}
        onClearAll={onClearAll}
      />,
    )
    await user.click(screen.getByRole('button', { name: /Wyczyść filtry/i }))
    expect(onClearAll).toHaveBeenCalled()
  })
})
