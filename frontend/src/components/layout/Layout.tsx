import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { BannerOffline } from '@/components/BannerOffline'
import { tituloDaRota } from '@/lib/nav'
import { limparRascunhosExpirados } from '@/lib/rascunhoDb'
import { useTelaEstreita } from '@/lib/useTelaEstreita'
import { useTituloPagina } from '@/lib/useTituloPagina'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

const CHAVE_SIDEBAR_COLAPSADA = 'siszoo:sidebar-collapsed'

const CONSULTA_MENU_RECOLHIDO = '(max-width: 1100px)'

function lerCollapsedInicial(): boolean {
  try {
    const salvo = localStorage.getItem(CHAVE_SIDEBAR_COLAPSADA)
    if (salvo !== null) return salvo === 'true'
  } catch {
  }
  return window.matchMedia?.(CONSULTA_MENU_RECOLHIDO).matches ?? false
}

function salvarCollapsed(valor: boolean) {
  try {
    localStorage.setItem(CHAVE_SIDEBAR_COLAPSADA, String(valor))
  } catch {
  }
}

export function Layout() {
  const [collapsed, setCollapsed] = useState(lerCollapsedInicial)
  const [menuAberto, setMenuAberto] = useState(false)
  const telaEstreita = useTelaEstreita()
  const { pathname } = useLocation()

  useTituloPagina(tituloDaRota(pathname))

  useEffect(() => {
    void limparRascunhosExpirados()
  }, [])

  function alternarCollapsed() {
    if (telaEstreita) {
      setMenuAberto(false)
      return
    }
    setCollapsed((valorAnterior) => {
      const novoValor = !valorAnterior
      salvarCollapsed(novoValor)
      return novoValor
    })
  }

  const recolhido = collapsed && !telaEstreita

  return (
    <div className={`app-shell${recolhido ? ' collapsed' : ''}`}>
      <a href="#conteudo" className="skip-link">
        Ir para o conteúdo
      </a>
      <Sidebar
        collapsed={recolhido}
        onToggleCollapsed={alternarCollapsed}
        menuAberto={menuAberto}
        onFecharMenu={() => setMenuAberto(false)}
      />
      {menuAberto && <div className="sidebar-fundo" onClick={() => setMenuAberto(false)} />}
      <div className="main">
        <Topbar onAbrirMenu={() => setMenuAberto(true)} />
        <main className="page" id="conteudo" tabIndex={-1}>
          <BannerOffline />
          <Outlet />
        </main>
      </div>
    </div>
  )
}
