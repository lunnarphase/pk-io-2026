import axios from 'axios'
import type { AuthTokens } from '@/types/domain'

const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

const bare = axios.create({ baseURL })

export async function register(email: string, password: string): Promise<AuthTokens> {
  const { data } = await bare.post<AuthTokens>('/auth/register', { email, password })
  return data
}

export async function login(email: string, password: string): Promise<AuthTokens> {
  const { data } = await bare.post<AuthTokens>('/auth/login', { email, password })
  return data
}

export async function refreshAuth(refreshToken: string): Promise<AuthTokens> {
  const { data } = await bare.post<AuthTokens>('/auth/refresh', { refreshToken })
  return data
}
