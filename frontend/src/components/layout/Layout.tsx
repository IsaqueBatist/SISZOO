import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Avisos } from '@/components/Avisos'
import { BannerOffline } from '@/components/BannerOffline'
import { tituloDaRota } from '@/lib/nav'
import { limparRascunhosExpirados } from '@/lib/rascunhoDb'
import { useTelaEstreita } from '@/lib/useTelaEstreita'
import { useTituloPagina } from '@/lib/useTituloPagina'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

const CHAVE_SIDEBAR_COLAPSADA = 'siszoo:sidebar-collapsed'

// Em telas médias o menu começa recolhido para dar espaço às tabelas. A escolha
// feita pela pessoa sempre vale mais.
const CONSULTA_MENU_RECOLHIDO = '(max-width: 1100px)'

// localStorage pode estar indisponível (modo privado, quota, navegador
// restrito) — nunca pode quebrar a tela, só perde a preferência.
function lerCollapsedInicial(): boolean {
  try {
    const salvo = localStorage.getItem(CHAVE_SIDEBAR_COLAPSADA)
    if (salvo !== null) return salvo === 'true'
  } catch {
    // Segue para o padrão da largura da tela.
  }
  return window.matchMedia?.(CONSULTA_MENU_RECOLHIDO).matches ?? false
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
  const [menuAberto, setMenuAberto] = useState(false)
  const telaEstreita = useTelaEstreita()
  const { pathname } = useLocation()

  useTituloPagina(tituloDaRota(pathname))

  // Manutenção do IndexedDB uma vez por carga da aplicação: rascunho vencido
  // (7 dias) e arquivo órfão saem do disco da máquina compartilhada. É
  // sincronização com um sistema externo, o caso legítimo de useEffect.
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

  // Na gaveta o menu aparece sempre com os rótulos, seja qual for a preferência.
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
      <Avisos />
    </div>
  )
}
