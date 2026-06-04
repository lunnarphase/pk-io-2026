import { beforeEach, describe, expect, it, vi } from 'vitest'
import { login, refreshAuth, register } from '@/api/auth'

const { mockPost } = vi.hoisted(() => ({
  mockPost: vi.fn(),
}))

vi.mock('axios', () => ({
  default: {
    create: () => ({ post: mockPost }),
  },
}))

describe('auth API', () => {
  beforeEach(() => {
    mockPost.mockReset()
  })

  it('register posts credentials', async () => {
    mockPost.mockResolvedValue({
      data: { accessToken: 'a', refreshToken: 'r' },
    })
    const tokens = await register('user@test.pl', 'password1')
    expect(mockPost).toHaveBeenCalledWith('/auth/register', {
      email: 'user@test.pl',
      password: 'password1',
    })
    expect(tokens.accessToken).toBe('a')
  })

  it('login posts credentials', async () => {
    mockPost.mockResolvedValue({
      data: { accessToken: 'a2', refreshToken: 'r2' },
    })
    await login('user@test.pl', 'secret123')
    expect(mockPost).toHaveBeenCalledWith('/auth/login', {
      email: 'user@test.pl',
      password: 'secret123',
    })
  })

  it('refreshAuth sends refresh token', async () => {
    mockPost.mockResolvedValue({
      data: { accessToken: 'new', refreshToken: 'r3' },
    })
    await refreshAuth('r3')
    expect(mockPost).toHaveBeenCalledWith('/auth/refresh', { refreshToken: 'r3' })
  })
})
