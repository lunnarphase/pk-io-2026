import type { QueryClient } from '@tanstack/react-query'

/** Pantry counts affect recipe detail (pantryMatch), suggestions, and pantry list. */
export function invalidatePantryDependentQueries(qc: QueryClient): void {
  void qc.invalidateQueries({ queryKey: [{ resource: 'pantry' }] })
  void qc.invalidateQueries({ queryKey: [{ resource: 'recipes' }] })
  void qc.invalidateQueries({ queryKey: [{ resource: 'suggestions' }] })
}
