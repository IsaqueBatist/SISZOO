import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'

// OCORRENCIAS_DENUNCIAS:leitura só é concedida a Administrador e Agente
// Sanitário — o Veterinário não acessa o módulo (V11 zera a linha da V3). O
// menu já não mostra o item (nav.ts); a rota repete a restrição para acesso
// direto por URL, como RotaGestaoBaias.
export function RotaLeituraOcorrencias() {
  const { roleKey } = useAuth()
  return roleKey === 'admin' || roleKey === 'agente' ? <Outlet /> : <Navigate to="/dashboard" replace />
}
