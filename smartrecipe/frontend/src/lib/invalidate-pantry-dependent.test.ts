import { describe, expect, it, vi } from 'vitest'
import { QueryClient } from '@tanstack/react-query'
import { invalidatePantryDependentQueries } from '@/lib/invalidate-pantry-dependent'

describe('invalidatePantryDependentQueries', () => {
  it('invalidates pantry, recipes and suggestions after pantry changes', () => {
    const qc = new QueryClient()
    const spy = vi.spyOn(qc, 'invalidateQueries')

    invalidatePantryDependentQueries(qc)

    expect(spy).toHaveBeenCalledTimes(3)
    expect(spy).toHaveBeenCalledWith({ queryKey: [{ resource: 'pantry' }] })
    expect(spy).toHaveBeenCalledWith({ queryKey: [{ resource: 'recipes' }] })
    expect(spy).toHaveBeenCalledWith({
      queryKey: [{ resource: 'suggestions' }],
      refetchType: 'all',
    })
  })
})
