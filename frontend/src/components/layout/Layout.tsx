import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { getCurrentRoleKey } from '../../lib/nav'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const [roleKey] = useState(getCurrentRoleKey)

  return (
    <div className={`app-shell${collapsed ? ' collapsed' : ''}`}>
      <Sidebar roleKey={roleKey} onToggleCollapsed={() => setCollapsed((value) => !value)} />
      <div className="main">
        <Topbar roleKey={roleKey} />
        <main className="page">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
