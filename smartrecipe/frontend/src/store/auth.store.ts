import { create } from 'zustand'
import type { AuthTokens } from '@/types/domain'

const ACCESS_KEY = 'smartrecipe_access'
const REFRESH_KEY = 'smartrecipe_refresh'

function readStorage(): { accessToken: string | null; refreshToken: string | null } {
  return {
    accessToken: localStorage.getItem(ACCESS_KEY),
    refreshToken: localStorage.getItem(REFRESH_KEY),
  }
}

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  setTokens: (tokens: AuthTokens) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>((set) => {
  const stored = readStorage()
  return {
    accessToken: stored.accessToken,
    refreshToken: stored.refreshToken,
    setTokens: ({ accessToken, refreshToken }) => {
      localStorage.setItem(ACCESS_KEY, accessToken)
      localStorage.setItem(REFRESH_KEY, refreshToken)
      set({ accessToken, refreshToken })
    },
    clear: () => {
      localStorage.removeItem(ACCESS_KEY)
      localStorage.removeItem(REFRESH_KEY)
      set({ accessToken: null, refreshToken: null })
    },
  }
})
