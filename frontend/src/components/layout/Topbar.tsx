import { useLocation } from 'react-router-dom'
import { NAV_ALL, ROLES, isNavGroup } from '../../lib/nav'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { MenuPerfil } from './MenuPerfil'

function currentCrumbLabel(pathname: string): string {
  const match = NAV_ALL.find((entry) => !isNavGroup(entry) && pathname.startsWith(entry.to))
  return match && !isNavGroup(match) ? match.label : 'Dashboard'
}

export function Topbar() {
  const location = useLocation()
  const { roleKey } = useAuth()
  const role = ROLES[roleKey]

  return (
    <header className="topbar">
      <div className="breadcrumb">
        <span className="crumb current">{currentCrumbLabel(location.pathname)}</span>
      </div>

      <div className="topbar-actions">
        <span className={`badge role-pill ${role.badgeCls}`} title="Papel atual">
          {role.short}
        </span>
        <MenuPerfil />
      </div>
    </header>
  )
}
