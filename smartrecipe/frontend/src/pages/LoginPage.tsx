import { Navigate } from 'react-router-dom'
import { LoginForm } from '@/features/auth/LoginForm'
import { useAuth } from '@/hooks/useAuth'

export function LoginPage() {
  const { isAuthenticated } = useAuth()
  if (isAuthenticated) return <Navigate to="/suggestions" replace />

  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center gap-6 px-4">
      <h1 className="page-heading text-center">Zaloguj się</h1>
      <LoginForm />
    </div>
  )
}
