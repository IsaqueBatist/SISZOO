import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'

export function RotaProtegida() {
  const { token, user, carregandoSessao } = useAuth()
  const location = useLocation()

  if (carregandoSessao) return <p role="status" className="carregando-sessao">Carregando sua sessão…</p>

  if (!token) return <Navigate to="/login" replace state={{ voltarPara: `${location.pathname}${location.search}` }} />

  if (user?.senhaAlteradaEm === null && location.pathname !== '/trocar-senha') {
    return <Navigate to="/trocar-senha" replace />
  }

  return <Outlet />
}
