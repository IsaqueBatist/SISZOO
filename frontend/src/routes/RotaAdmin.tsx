import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'

export function RotaAdmin() {
  const { roleKey } = useAuth()
  return roleKey === 'admin' ? <Outlet /> : <Navigate to="/dashboard" replace />
}
