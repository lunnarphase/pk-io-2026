import { beforeEach, describe, expect, it } from 'vitest'
import { useAuthStore } from '@/store/auth.store'

describe('useAuthStore', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.setState({
      accessToken: null,
      refreshToken: null,
    })
  })

  it('persists tokens to localStorage on setTokens', () => {
    useAuthStore.getState().setTokens({
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
    })
    expect(useAuthStore.getState().accessToken).toBe('access-1')
    expect(localStorage.getItem('smartrecipe_access')).toBe('access-1')
    expect(localStorage.getItem('smartrecipe_refresh')).toBe('refresh-1')
  })

  it('clears tokens on logout', () => {
    useAuthStore.getState().setTokens({
      accessToken: 'a',
      refreshToken: 'r',
    })
    useAuthStore.getState().clear()
    expect(useAuthStore.getState().accessToken).toBeNull()
    expect(localStorage.getItem('smartrecipe_access')).toBeNull()
  })
})
