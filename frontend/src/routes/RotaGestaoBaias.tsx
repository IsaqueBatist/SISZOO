import { Outlet } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { RedirecionarSemAcesso } from './RedirecionarSemAcesso'

export function RotaGestaoBaias() {
  const { roleKey } = useAuth()
  return roleKey === 'admin' || roleKey === 'vet' ? <Outlet /> : <RedirecionarSemAcesso para="/dashboard" />
}
