import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'

export function RotaProtegida() {
  const { token, user } = useAuth()
  const location = useLocation()

  if (!token) return <Navigate to="/login" replace />

  if (user?.senhaAlteradaEm === null && location.pathname !== '/trocar-senha') {
    return <Navigate to="/trocar-senha" replace />
  }

  return <Outlet />
}
