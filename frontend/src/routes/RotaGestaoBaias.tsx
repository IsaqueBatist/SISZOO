import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import { roleKeyFromCargos } from '../lib/nav'

// `nav.ts` só inclui 'baias' no access de admin/vet (Agente Sanitário não vê
// "Gestão de Baias" no menu, mesmo tendo GESTAO_ANIMAIS:leitura na API) — a
// rota replica essa restrição também para acesso direto por URL.
export function RotaGestaoBaias() {
  const { user } = useAuth()
  const roleKey = roleKeyFromCargos(user?.cargos ?? [])
  return roleKey === 'admin' || roleKey === 'vet' ? <Outlet /> : <Navigate to="/dashboard" replace />
}
