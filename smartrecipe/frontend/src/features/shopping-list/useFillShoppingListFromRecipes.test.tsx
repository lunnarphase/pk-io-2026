import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { useFillShoppingListFromRecipes } from '@/features/shopping-list/useFillShoppingListFromRecipes'
import { fillShoppingList } from '@/api/shopping-list'

vi.mock('@/api/shopping-list', () => ({ fillShoppingList: vi.fn() }))
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  })
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  )
}

describe('useFillShoppingListFromRecipes', () => {
  beforeEach(() => {
    vi.mocked(fillShoppingList).mockReset()
    vi.mocked(fillShoppingList).mockResolvedValue({ id: 'sl-1', items: [] })
  })

  it('fills shopping list from recipe ids', async () => {
    const { result } = renderHook(() => useFillShoppingListFromRecipes(), { wrapper })
    result.current.mutate(['r1', 'r2'])
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(fillShoppingList).toHaveBeenCalledWith(['r1', 'r2'])
  })
})
