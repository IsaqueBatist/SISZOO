import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'

// OCORRENCIAS_DENUNCIAS:escrita (V3__seed_cargos.sql) só é concedida a
// Administrador e Agente Sanitário. No AppRoutes esta guarda fica dentro de
// RotaLeituraOcorrencias, que já barra o Veterinário (sem acesso ao módulo
// desde a V11); ela continua separando leitura de escrita. A rota de cadastro
// não deve nem aparecer para quem não tem escrita.
export function RotaEscritaOcorrencias() {
  const { roleKey } = useAuth()
  return roleKey === 'admin' || roleKey === 'agente' ? <Outlet /> : <Navigate to="/ocorrencias" replace />
}
