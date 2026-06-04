import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { register as registerUser } from '@/api/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'

const schema = z.object({
  email: z.string().email('Podaj poprawny adres e-mail'),
  password: z.string().min(8, 'Hasło: min. 8 znaków'),
})

type FormValues = z.infer<typeof schema>

export function RegisterForm() {
  const navigate = useNavigate()
  const { setTokens } = useAuth()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const mutation = useMutation({
    mutationFn: ({ email, password }: FormValues) => registerUser(email, password),
    onSuccess: (tokens) => {
      setTokens(tokens)
      navigate('/suggestions', { replace: true })
    },
  })

  return (
    <form
      className="mx-auto flex w-full max-w-sm flex-col gap-4"
      onSubmit={handleSubmit((v) => mutation.mutate(v))}
      noValidate
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" type="email" autoComplete="email" {...register('email')} />
        {errors.email ? <p className="text-sm text-[var(--color-destructive)]">{errors.email.message}</p> : null}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Hasło</Label>
        <Input id="password" type="password" autoComplete="new-password" {...register('password')} />
        {errors.password ? (
          <p className="text-sm text-[var(--color-destructive)]">{errors.password.message}</p>
        ) : null}
      </div>
      {mutation.isError ? (
        <p className="text-sm text-[var(--color-destructive)]">Rejestracja nie powiodła się. Spróbuj ponownie.</p>
      ) : null}
      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'Tworzenie konta...' : 'Utwórz konto'}
      </Button>
      <p className="text-center text-sm text-[var(--color-muted)]">
        Masz już konto?{' '}
        <Link className="text-[var(--color-accent)] underline" to="/login">
          Zaloguj się
        </Link>
      </p>
    </form>
  )
}
