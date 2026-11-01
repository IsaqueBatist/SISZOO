import { Outlet } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { RedirecionarSemAcesso } from './RedirecionarSemAcesso'

export function RotaAdmin() {
  const { roleKey } = useAuth()
  return roleKey === 'admin' ? <Outlet /> : <RedirecionarSemAcesso para="/dashboard" />
}
