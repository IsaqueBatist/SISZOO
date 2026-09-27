import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'

// OCORRENCIAS_DENUNCIAS:escrita (V3__seed_cargos.sql) só é concedida a
// Administrador e Agente Sanitário — Veterinário tem apenas leitura nesse
// módulo (ao contrário de GESTAO_ANIMAIS). A rota de cadastro não deve nem
// aparecer para quem não tem escrita.
export function RotaEscritaOcorrencias() {
  const { roleKey } = useAuth()
  return roleKey === 'admin' || roleKey === 'agente' ? <Outlet /> : <Navigate to="/ocorrencias" replace />
}
