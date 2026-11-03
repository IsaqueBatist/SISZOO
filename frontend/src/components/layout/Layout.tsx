import { useCallback, useEffect, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { BannerOffline } from '@/components/BannerOffline'
import { tituloDaRota } from '@/lib/nav'
import { limparRascunhosExpirados } from '@/lib/rascunhoDb'
import { useTabelasResponsivas } from '@/lib/tabelasResponsivas'
import { useTelaEstreita } from '@/lib/useTelaEstreita'
import { useTituloPagina } from '@/lib/useTituloPagina'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

const CHAVE_SIDEBAR_COLAPSADA = 'siszoo:sidebar-collapsed'

const CONSULTA_MENU_RECOLHIDO = '(max-width: 1024px)'

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
  const botaoMenuRef = useRef<HTMLButtonElement>(null)
  const gavetaAberta = menuAberto && telaEstreita

  const fecharMenu = useCallback(() => {
    setMenuAberto((aberto) => {
      if (aberto) requestAnimationFrame(() => botaoMenuRef.current?.focus())
      return false
    })
  }, [])

  useEffect(() => {
    fecharMenu()
  }, [pathname, fecharMenu])

  useEffect(() => {
    if (!gavetaAberta) return
    document.querySelector<HTMLElement>('#menu-lateral .sidebar-toggle')?.focus()
    const overflowAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function aoPressionarTecla(evento: KeyboardEvent) {
      if (evento.key === 'Escape') fecharMenu()
    }
    document.addEventListener('keydown', aoPressionarTecla)
    return () => {
      document.body.style.overflow = overflowAnterior
      document.removeEventListener('keydown', aoPressionarTecla)
    }
  }, [gavetaAberta, fecharMenu])

  useTituloPagina(tituloDaRota(pathname))
  useTabelasResponsivas()

  useEffect(() => {
    void limparRascunhosExpirados()
  }, [])

  function alternarCollapsed() {
    if (telaEstreita) {
      fecharMenu()
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
        modoGaveta={telaEstreita}
        onFecharMenu={fecharMenu}
      />
      {gavetaAberta && <div className="sidebar-fundo" onClick={fecharMenu} />}
      <div className="main" inert={gavetaAberta || undefined}>
        <Topbar onAbrirMenu={() => setMenuAberto(true)} menuAberto={gavetaAberta} botaoMenuRef={botaoMenuRef} />
        <main className="page" id="conteudo" tabIndex={-1}>
          <BannerOffline />
          <Outlet />
        </main>
      </div>
    </div>
  )
}
