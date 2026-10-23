import { useNavigate } from 'react-router-dom'
import { useAuth } from './useAuth'

// Compartilhado pelo botão de sair da sidebar e pelo menu de perfil do
// topbar — antes cada lugar reimplementava `logout()` + `navigate('/login')`.
export function useSair() {
  const navigate = useNavigate()
  const { logout } = useAuth()

  return () => {
    logout()
    navigate('/login')
  }
}
