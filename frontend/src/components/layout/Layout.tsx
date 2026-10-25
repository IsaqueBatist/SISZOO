import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { BannerOffline } from '@/components/BannerOffline'
import { limparRascunhosExpirados } from '@/lib/rascunhoDb'
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

  // Manutenção do IndexedDB uma vez por carga da aplicação: rascunho vencido
  // (7 dias) e arquivo órfão saem do disco da máquina compartilhada. É
  // sincronização com um sistema externo, o caso legítimo de useEffect.
  useEffect(() => {
    void limparRascunhosExpirados()
  }, [])

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
          <BannerOffline />
          <Outlet />
        </main>
      </div>
    </div>
  )
}
