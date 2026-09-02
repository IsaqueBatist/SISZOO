import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'

// GESTAO_ANIMAIS:escrita (V3__seed_cargos.sql) só é concedida a Administrador
// e Veterinário — Agente Sanitário tem apenas leitura e recebe 403 do backend
// em POST/PUT /api/animais. A rota de cadastro/edição não deve nem aparecer.
export function RotaEscritaAnimais() {
  const { roleKey } = useAuth()
  return roleKey === 'admin' || roleKey === 'vet' ? <Outlet /> : <Navigate to="/animais" replace />
}
