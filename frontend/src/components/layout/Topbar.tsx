import type { Ref } from 'react'
import { useLocation } from 'react-router-dom'
import { rotuloDaRota } from '../../lib/nav'
import { MenuNotificacoes } from './MenuNotificacoes'
import { Icon } from './Icon'
import { MenuPerfil } from './MenuPerfil'


interface TopbarProps {
  onAbrirMenu?: () => void
  menuAberto?: boolean
  botaoMenuRef?: Ref<HTMLButtonElement>
}

export function Topbar({ onAbrirMenu, menuAberto = false, botaoMenuRef }: TopbarProps) {
  const location = useLocation()

  return (
    <header className="topbar">
      <button
        ref={botaoMenuRef}
        type="button"
        className="icon-btn menu-btn"
        aria-label="Abrir menu"
        aria-controls="menu-lateral"
        aria-expanded={menuAberto}
        onClick={onAbrirMenu}
      >
        <Icon name="menu" />
      </button>
      <div className="breadcrumb">
        <span className="crumb current">{rotuloDaRota(location.pathname)}</span>
      </div>

      <div className="topbar-actions">
        <MenuNotificacoes />
        <MenuPerfil />
      </div>
    </header>
  )
}
