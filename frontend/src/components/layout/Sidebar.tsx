import { NavLink, useNavigate } from 'react-router-dom'
import { ROLES, getNavForRole, isNavGroup, type RoleKey } from '../../lib/nav'
import { useAuth } from '../../features/auth/AuthContext'
import { Icon } from './Icon'

interface SidebarProps {
  roleKey: RoleKey
  onToggleCollapsed: () => void
}

export function Sidebar({ roleKey, onToggleCollapsed }: SidebarProps) {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const role = ROLES[roleKey]
  const nav = getNavForRole(roleKey)

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <NavLink to="/dashboard" className="sidebar-logo" style={{ textDecoration: 'none' }}>
          <div className="wordmark">
            <span className="mark">
              <Icon name="paw" size={16} />
            </span>
            SISZOO
          </div>
          <div className="tagline">CCZ Itu</div>
        </NavLink>
        <button
          type="button"
          className="sidebar-toggle"
          title="Recolher"
          onClick={onToggleCollapsed}
        >
          <Icon name="chevronLeft" />
        </button>
      </div>

      <nav className="sidebar-nav">
        {nav.map((entry, index) =>
          isNavGroup(entry) ? (
            <div className="sidebar-group-label" key={`group-${entry.group}-${index}`}>
              {entry.group}
            </div>
          ) : (
            <NavLink
              key={entry.id}
              to={entry.to}
              className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}
            >
              <span className="icon">
                <Icon name={entry.icon} />
              </span>
              <span className="label">{entry.label}</span>
              {entry.badge ? <span className="badge-count">{entry.badge}</span> : null}
            </NavLink>
          ),
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="avatar">{role.initials}</div>
        <div style={{ minWidth: 0 }}>
          <div className="user-name">{role.name}</div>
          <div className="user-role">{role.label}</div>
        </div>
        <button
          type="button"
          className="logout-btn"
          title="Sair"
          onClick={() => {
            logout()
            navigate('/login')
          }}
        >
          <Icon name="logout" size={14} />
        </button>
      </div>
    </aside>
  )
}
