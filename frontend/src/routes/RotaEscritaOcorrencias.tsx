import { Outlet } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { RedirecionarSemAcesso } from './RedirecionarSemAcesso'

export function RotaEscritaOcorrencias() {
  const { roleKey } = useAuth()
  return roleKey === 'admin' || roleKey === 'agente' ? <Outlet /> : <RedirecionarSemAcesso para="/ocorrencias" />
}
