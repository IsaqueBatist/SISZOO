import { Outlet } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { podeAcessar } from '@/lib/nav'
import { RedirecionarSemAcesso } from './RedirecionarSemAcesso'

export function RotaLeituraAnimais() {
  const { roleKey } = useAuth()
  return podeAcessar(roleKey, 'animais') ? <Outlet /> : <RedirecionarSemAcesso para="/dashboard" />
}
