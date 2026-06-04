import { describe, expect, it, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from '@/router/ProtectedRoute'
import { useAuthStore } from '@/store/auth.store'
import { renderWithProviders } from '@/test/test-utils'

function SecretPage() {
  return <p>Secret content</p>
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    useAuthStore.getState().clear()
  })

  it('redirects unauthenticated users to login', () => {
    renderWithProviders(
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<SecretPage />} />
        </Route>
        <Route path="/login" element={<p>Login page</p>} />
      </Routes>,
      { route: '/' },
    )
    expect(screen.getByText('Login page')).toBeInTheDocument()
  })

  it('renders child route when access token is present', () => {
    useAuthStore.getState().setTokens({
      accessToken: 'token',
      refreshToken: 'refresh',
    })
    renderWithProviders(
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<SecretPage />} />
        </Route>
        <Route path="/login" element={<p>Login page</p>} />
      </Routes>,
      { route: '/' },
    )
    expect(screen.getByText('Secret content')).toBeInTheDocument()
  })
})
