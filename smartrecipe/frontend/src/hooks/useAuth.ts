import { useAuthStore } from '@/store/auth.store'

export function useAuth() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const refreshToken = useAuthStore((s) => s.refreshToken)
  const setTokens = useAuthStore((s) => s.setTokens)
  const clear = useAuthStore((s) => s.clear)

  return {
    isAuthenticated: Boolean(accessToken),
    accessToken,
    refreshToken,
    setTokens,
    logout: clear,
  }
}
