import { useLocation } from 'react-router-dom'
import { NAV_ALL, ROLES, isNavGroup, type RoleKey } from '../../lib/nav'
import { Icon } from './Icon'

interface TopbarProps {
  roleKey: RoleKey
}

function currentCrumbLabel(pathname: string): string {
  const match = NAV_ALL.find((entry) => !isNavGroup(entry) && pathname.startsWith(entry.to))
  return match && !isNavGroup(match) ? match.label : 'Dashboard'
}

export function Topbar({ roleKey }: TopbarProps) {
  const location = useLocation()
  const role = ROLES[roleKey]

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
          <div className="avatar">{role.initials}</div>
          <span className="name">{role.name.split(' ')[0]}</span>
        </div>
      </div>
    </header>
  )
}
