import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { useCookRecipe } from '@/features/recipes/useCookRecipe'
import { cookRecipe } from '@/api/recipes'

vi.mock('@/api/recipes', () => ({ cookRecipe: vi.fn() }))
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

describe('useCookRecipe', () => {
  beforeEach(() => {
    vi.mocked(cookRecipe).mockReset()
    vi.mocked(cookRecipe).mockResolvedValue([])
  })

  it('calls cookRecipe API on mutate', async () => {
    const { result } = renderHook(() => useCookRecipe('recipe-42'), { wrapper })
    result.current.mutate()
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(cookRecipe).toHaveBeenCalledWith('recipe-42')
  })
})
