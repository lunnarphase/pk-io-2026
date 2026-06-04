import { describe, expect, it, vi } from 'vitest'
import { createIngredient, searchIngredients } from '@/api/ingredients'
import { apiClient } from '@/api/client'

vi.mock('@/api/client', () => ({
  apiClient: { get: vi.fn(), post: vi.fn() },
}))

describe('ingredients API', () => {
  it('searchIngredients omits params when query is empty', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: [] })
    await searchIngredients('')
    expect(apiClient.get).toHaveBeenCalledWith('/ingredients', { params: undefined })
  })

  it('searchIngredients passes search param', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: [{ id: '1', name: 'Mąka' }] })
    const hits = await searchIngredients('mąka')
    expect(apiClient.get).toHaveBeenCalledWith('/ingredients', { params: { search: 'mąka' } })
    expect(hits[0]?.name).toBe('Mąka')
  })

  it('createIngredient posts name', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      data: { id: '2', name: 'Cukier' },
    })
    const created = await createIngredient('Cukier')
    expect(apiClient.post).toHaveBeenCalledWith('/ingredients', { name: 'Cukier' })
    expect(created.name).toBe('Cukier')
  })
})
