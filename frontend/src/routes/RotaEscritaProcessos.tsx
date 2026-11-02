import { Outlet } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { RedirecionarSemAcesso } from './RedirecionarSemAcesso'

export function RotaEscritaProcessos() {
  const { roleKey } = useAuth()
  return roleKey === 'admin' || roleKey === 'vet' || roleKey === 'agente' ? <Outlet /> : <RedirecionarSemAcesso para="/processos" />
}
