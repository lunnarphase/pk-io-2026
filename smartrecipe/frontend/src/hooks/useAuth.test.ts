import { describe, expect, it, beforeEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/auth.store'

describe('useAuth', () => {
  beforeEach(() => {
    useAuthStore.getState().clear()
  })

  it('reports unauthenticated without token', () => {
    const { result } = renderHook(() => useAuth())
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.accessToken).toBeNull()
  })

  it('reports authenticated after setTokens', () => {
    useAuthStore.getState().setTokens({
      accessToken: 'access',
      refreshToken: 'refresh',
    })
    const { result } = renderHook(() => useAuth())
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.accessToken).toBe('access')
  })

  it('logout clears session', () => {
    useAuthStore.getState().setTokens({
      accessToken: 'access',
      refreshToken: 'refresh',
    })
    const { result } = renderHook(() => useAuth())
    act(() => {
      result.current.logout()
    })
    expect(useAuthStore.getState().accessToken).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })
})
