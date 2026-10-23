import { NavLink } from 'react-router-dom'
import { ROLES, getNavForRole, isNavGroup } from '../../lib/nav'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useSair } from '@/features/auth/hooks/useSair'
import { Icon } from './Icon'

interface SidebarProps {
  collapsed: boolean
  onToggleCollapsed: () => void
}

export function Sidebar({ collapsed, onToggleCollapsed }: SidebarProps) {
  const { user, roleKey } = useAuth()
  const sair = useSair()
  const role = ROLES[roleKey]
  const nav = getNavForRole(roleKey)
  const nomeCompleto = user ? `${user.nome} ${user.sobrenome}` : ''
  const iniciais = user ? `${user.nome[0] ?? ''}${user.sobrenome[0] ?? ''}`.toUpperCase() : ''
  const classeOculta = collapsed ? ' visually-hidden' : ''

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <NavLink to="/dashboard" className="sidebar-logo" style={{ textDecoration: 'none' }}>
          <div className="wordmark">
            <span className="mark">
              <Icon name="paw" size={16} />
            </span>
            <span className={classeOculta.trim() || undefined}>SISZOO</span>
          </div>
          <div className={`tagline${classeOculta}`}>CCZ Itu</div>
        </NavLink>
        <button
          type="button"
          className="sidebar-toggle"
          title={collapsed ? 'Expandir' : 'Recolher'}
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          aria-expanded={!collapsed}
          onClick={onToggleCollapsed}
        >
          <span className={`sidebar-toggle-icon${collapsed ? ' collapsed' : ''}`}>
            <Icon name="chevronLeft" />
          </span>
        </button>
      </div>

      <nav className="sidebar-nav">
        {nav.map((entry) =>
          isNavGroup(entry) ? (
            <div className={`sidebar-group-label${classeOculta}`} key={entry.group}>
              {entry.group}
            </div>
          ) : (
            <NavLink
              key={entry.id}
              to={entry.to}
              className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}
              title={entry.label}
            >
              <span className="icon">
                <Icon name={entry.icon} />
              </span>
              <span className={`label${classeOculta}`}>{entry.label}</span>
              {entry.badge ? <span className={`badge-count${classeOculta}`}>{entry.badge}</span> : null}
            </NavLink>
          ),
        )}
      </nav>

      <div className="sidebar-footer">
        <NavLink to="/perfil" className="sidebar-footer-link" title="Meu perfil">
          <div className="avatar">{iniciais}</div>
          <div className={classeOculta.trim() || undefined} style={{ minWidth: 0 }}>
            <div className="user-name">{nomeCompleto}</div>
            <div className="user-role">{role.label}</div>
          </div>
        </NavLink>
        <button type="button" className={`logout-btn${classeOculta}`} title="Sair" onClick={sair}>
          <Icon name="logout" size={14} />
        </button>
      </div>
    </aside>
  )
}
