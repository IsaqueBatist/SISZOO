import { useLocation } from 'react-router-dom'
import { ROLES, rotuloDaRota } from '../../lib/nav'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { MenuNotificacoes } from './MenuNotificacoes'
import { Icon } from './Icon'
import { MenuPerfil } from './MenuPerfil'

interface TopbarProps {
  onAbrirMenu?: () => void
}

export function Topbar({ onAbrirMenu }: TopbarProps) {
  const location = useLocation()
  const { roleKey } = useAuth()
  const role = ROLES[roleKey]

  return (
    <header className="topbar">
      <button type="button" className="icon-btn menu-btn" aria-label="Abrir menu" onClick={onAbrirMenu}>
        <Icon name="menu" />
      </button>
      <div className="breadcrumb">
        <span className="crumb current">{rotuloDaRota(location.pathname)}</span>
      </div>

      <div className="topbar-actions">
        <span className={`badge role-pill ${role.badgeCls}`} title="Papel atual">
          {role.short}
        </span>
        <MenuNotificacoes />
        <MenuPerfil />
      </div>
    </header>
  )
}
