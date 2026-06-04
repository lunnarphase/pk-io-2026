import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { isAxiosError } from 'axios'
import { toast } from 'sonner'
import { LifecycleActions } from '@/features/recipes/LifecycleActions'
import { recipeLifecycle } from '@/api/recipes'
import { RecipeLifecycleStatus, type Recipe } from '@/types/domain'
import { renderWithProviders } from '@/test/test-utils'

vi.mock('@/api/recipes', () => ({
  recipeLifecycle: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('axios', () => ({
  isAxiosError: vi.fn(),
}))

function recipe(status: RecipeLifecycleStatus): Recipe {
  return {
    id: 'r1',
    title: 'Test',
    instructions: null,
    estimatedKcalPerServing: null,
    servings: null,
    lifecycleStatus: status,
    dietType: null,
    cuisineType: null,
  }
}

describe('LifecycleActions (Recipe lifecycle DRAFT → ACTIVE → ARCHIVED)', () => {
  beforeEach(() => {
    vi.mocked(recipeLifecycle).mockReset()
    vi.mocked(isAxiosError).mockReturnValue(false)
    vi.mocked(recipeLifecycle).mockResolvedValue(
      recipe(RecipeLifecycleStatus.ACTIVE),
    )
  })

  it('shows publish for drafts', () => {
    renderWithProviders(<LifecycleActions recipe={recipe(RecipeLifecycleStatus.DRAFT)} />)
    expect(screen.getByRole('button', { name: 'Opublikuj' })).toBeInTheDocument()
  })

  it('shows draft and archive actions for active recipes', () => {
    renderWithProviders(<LifecycleActions recipe={recipe(RecipeLifecycleStatus.ACTIVE)} />)
    expect(screen.getByRole('button', { name: 'Cofnij do szkicu' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Archiwizuj' })).toBeInTheDocument()
  })

  it('calls recipeLifecycle on publish', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LifecycleActions recipe={recipe(RecipeLifecycleStatus.DRAFT)} />)
    await user.click(screen.getByRole('button', { name: 'Opublikuj' }))
    expect(recipeLifecycle).toHaveBeenCalledWith('r1', 'publish')
  })

  it('archives active recipe', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LifecycleActions recipe={recipe(RecipeLifecycleStatus.ACTIVE)} />)
    await user.click(screen.getByRole('button', { name: 'Archiwizuj' }))
    expect(recipeLifecycle).toHaveBeenCalledWith('r1', 'archive')
  })

  it('unarchives archived recipe', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LifecycleActions recipe={recipe(RecipeLifecycleStatus.ARCHIVED)} />)
    await user.click(screen.getByRole('button', { name: 'Przywróć' }))
    expect(recipeLifecycle).toHaveBeenCalledWith('r1', 'unarchive')
  })

  it('shows validation toast on 422', async () => {
    vi.mocked(isAxiosError).mockReturnValue(true)
    vi.mocked(recipeLifecycle).mockRejectedValue({ response: { status: 422 } })
    const user = userEvent.setup()
    renderWithProviders(<LifecycleActions recipe={recipe(RecipeLifecycleStatus.DRAFT)} />)
    await user.click(screen.getByRole('button', { name: 'Opublikuj' }))
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Niedozwolone przejście statusu (422)'),
    )
  })
})
