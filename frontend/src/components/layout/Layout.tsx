import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function Layout() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className={`app-shell${collapsed ? ' collapsed' : ''}`}>
      <Sidebar onToggleCollapsed={() => setCollapsed((value) => !value)} />
      <div className="main">
        <Topbar />
        <main className="page">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
