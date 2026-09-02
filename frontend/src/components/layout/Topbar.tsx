import { useLocation } from 'react-router-dom'
import { NAV_ALL, ROLES, isNavGroup } from '../../lib/nav'
import { useAuth } from '../../features/auth/AuthContext'
import { Icon } from './Icon'

function currentCrumbLabel(pathname: string): string {
  const match = NAV_ALL.find((entry) => !isNavGroup(entry) && pathname.startsWith(entry.to))
  return match && !isNavGroup(match) ? match.label : 'Dashboard'
}

export function Topbar() {
  const location = useLocation()
  const { user, roleKey } = useAuth()
  const role = ROLES[roleKey]
  const iniciais = user ? `${user.nome[0] ?? ''}${user.sobrenome[0] ?? ''}`.toUpperCase() : ''

  return (
    <header className="topbar">
      <div className="breadcrumb">
        <span className="crumb current">{currentCrumbLabel(location.pathname)}</span>
      </div>

      <div className="global-search">
        <span className="search-icon">
          <Icon name="search" size={16} />
        </span>
        <input type="text" placeholder="Buscar animal, protocolo, ocorrência..." />
      </div>

      <div className="topbar-actions">
        <span className={`badge role-pill ${role.badgeCls}`} title="Papel atual">
          {role.short}
        </span>
        <div className="topbar-user">
          <div className="avatar">{iniciais}</div>
          <span className="name">{user?.nome ?? ''}</span>
        </div>
      </div>
    </header>
  )
}
