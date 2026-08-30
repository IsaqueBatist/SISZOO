import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import { roleKeyFromCargos } from '../lib/nav'

export function RotaAdmin() {
  const { user } = useAuth()
  const roleKey = roleKeyFromCargos(user?.cargos ?? [])
  return roleKey === 'admin' ? <Outlet /> : <Navigate to="/dashboard" replace />
}
