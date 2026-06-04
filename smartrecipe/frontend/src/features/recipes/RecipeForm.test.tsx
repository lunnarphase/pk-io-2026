import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { RecipeForm } from '@/features/recipes/RecipeForm'

vi.mock('@/components/ui/rich-text-editor', () => ({
  RichTextEditor: ({
    value,
    onChange,
  }: {
    value?: string
    onChange: (html: string) => void
  }) => (
    <textarea
      aria-label="Instrukcje"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}))
import { CuisineType, DietType, RecipeLifecycleStatus } from '@/types/domain'
import { renderWithProviders } from '@/test/test-utils'

describe('RecipeForm (Recipe metadata - title, diet, cuisine, servings, kcal)', () => {
  it('shows validation error when title is empty', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    renderWithProviders(
      <RecipeForm
        defaultValues={{
          title: '',
          lifecycleStatus: RecipeLifecycleStatus.DRAFT,
        }}
        onSubmit={onSubmit}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Zapisz' }))
    expect(screen.getByText('Tytuł jest wymagany')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('submits normalized values including diet and cuisine', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    renderWithProviders(
      <RecipeForm
        defaultValues={{
          title: 'Barszcz',
          dietType: DietType.VEGETARIAN,
          cuisineType: CuisineType.POLISH,
          servings: 4,
          estimatedKcalPerServing: 250,
          lifecycleStatus: RecipeLifecycleStatus.DRAFT,
        }}
        onSubmit={onSubmit}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Zapisz' }))
    expect(onSubmit).toHaveBeenCalled()
    const [values] = onSubmit.mock.calls[0]!
    expect(values).toMatchObject({
      title: 'Barszcz',
      dietType: DietType.VEGETARIAN,
      cuisineType: CuisineType.POLISH,
      servings: 4,
      estimatedKcalPerServing: 250,
    })
  })
})
