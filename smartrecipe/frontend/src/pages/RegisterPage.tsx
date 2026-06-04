import { Navigate } from 'react-router-dom'
import { RegisterForm } from '@/features/auth/RegisterForm'
import { useAuth } from '@/hooks/useAuth'

export function RegisterPage() {
  const { isAuthenticated } = useAuth()
  if (isAuthenticated) return <Navigate to="/suggestions" replace />

  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center gap-6 px-4">
      <h1 className="page-heading text-center">Utwórz konto</h1>
      <RegisterForm />
    </div>
  )
}
