import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

const CHAVE_SIDEBAR_COLAPSADA = 'siszoo:sidebar-collapsed'

// localStorage pode estar indisponível (modo privado, quota, navegador
// restrito) — nunca pode quebrar a tela, só perde a preferência.
function lerCollapsedInicial(): boolean {
  try {
    return localStorage.getItem(CHAVE_SIDEBAR_COLAPSADA) === 'true'
  } catch {
    return false
  }
}

function salvarCollapsed(valor: boolean) {
  try {
    localStorage.setItem(CHAVE_SIDEBAR_COLAPSADA, String(valor))
  } catch {
    // Segue só em memória nesta sessão.
  }
}

export function Layout() {
  const [collapsed, setCollapsed] = useState(lerCollapsedInicial)

  function alternarCollapsed() {
    setCollapsed((valorAnterior) => {
      const novoValor = !valorAnterior
      salvarCollapsed(novoValor)
      return novoValor
    })
  }

  return (
    <div className={`app-shell${collapsed ? ' collapsed' : ''}`}>
      <Sidebar collapsed={collapsed} onToggleCollapsed={alternarCollapsed} />
      <div className="main">
        <Topbar />
        <main className="page">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
