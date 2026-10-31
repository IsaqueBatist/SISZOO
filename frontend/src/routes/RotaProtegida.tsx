import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'

export function RotaProtegida() {
  const { token, user } = useAuth()
  const location = useLocation()

  // Link direto sem sessão: depois de entrar, segue para onde a pessoa ia.
  if (!token) return <Navigate to="/login" replace state={{ voltarPara: `${location.pathname}${location.search}` }} />

  if (user?.senhaAlteradaEm === null && location.pathname !== '/trocar-senha') {
    return <Navigate to="/trocar-senha" replace />
  }

  return <Outlet />
}
