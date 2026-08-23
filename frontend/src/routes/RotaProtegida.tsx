import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'

export function RotaProtegida() {
  const { token } = useAuth()
  return token ? <Outlet /> : <Navigate to="/login" replace />
}
