import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'

// PROCESSOS_SANITARIOS:escrita (V3__seed_cargos.sql) é concedida aos 3
// perfis (Administrador, Veterinário e Agente Sanitário) — só a exclusão é
// exclusiva do Admin. Diferente de RotaEscritaOcorrencias (admin+agente) e
// RotaEscritaAnimais (admin+vet), aqui os 3 `roleKey` liberam a rota; a
// checagem explícita continua existindo para negar por padrão (fail-closed)
// se um perfil futuro sem essa permissão for adicionado.
export function RotaEscritaProcessos() {
  const { roleKey } = useAuth()
  return roleKey === 'admin' || roleKey === 'vet' || roleKey === 'agente' ? <Outlet /> : <Navigate to="/processos" replace />
}
