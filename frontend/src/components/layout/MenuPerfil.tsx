import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ROLES } from '@/lib/nav'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useSair } from '@/features/auth/hooks/useSair'
import { Icon } from './Icon'
import { useClickOutside } from './useClickOutside'

export function MenuPerfil() {
  const { user, roleKey } = useAuth()
  const sair = useSair()
  const role = ROLES[roleKey]
  const [aberto, setAberto] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const botaoRef = useRef<HTMLButtonElement>(null)
  const primeiroItemRef = useRef<HTMLAnchorElement>(null)

  function fechar() {
    setAberto(false)
    botaoRef.current?.focus()
  }

  useClickOutside(containerRef, fechar, aberto)

  useEffect(() => {
    if (aberto) primeiroItemRef.current?.focus()
  }, [aberto])

  const iniciais = user ? `${user.nome[0] ?? ''}${user.sobrenome[0] ?? ''}`.toUpperCase() : ''
  const nomeCompleto = user ? `${user.nome} ${user.sobrenome}` : ''

  return (
    <div className="menu-perfil" ref={containerRef}>
      <button
        ref={botaoRef}
        type="button"
        className="topbar-user"
        aria-haspopup="menu"
        aria-expanded={aberto}
        onClick={() => setAberto((valor) => !valor)}
        onKeyDown={(evento) => {
          if (evento.key === 'ArrowDown') {
            evento.preventDefault()
            setAberto(true)
          }
        }}
      >
        <div className="avatar">{iniciais}</div>
        <span className="name">{user?.nome ?? ''}</span>
        <Icon name="chevronDown" size={14} />
      </button>

      {aberto && (
        <div className="menu-perfil-popover" role="menu" aria-label="Menu do usuário">
          <div className="menu-perfil-header">
            <div className="menu-perfil-nome">{nomeCompleto}</div>
            <div className="menu-perfil-email">{user?.email ?? ''}</div>
            <span className={`badge role-pill ${role.badgeCls}`}>{role.short}</span>
          </div>
          <Link ref={primeiroItemRef} to="/perfil" role="menuitem" className="menu-perfil-item" onClick={fechar}>
            <Icon name="user" size={14} />
            Meu perfil
          </Link>
          <Link to="/configuracoes" role="menuitem" className="menu-perfil-item" onClick={fechar}>
            <Icon name="cog" size={14} />
            Configurações
          </Link>
          <button type="button" role="menuitem" className="menu-perfil-item" onClick={sair}>
            <Icon name="logout" size={14} />
            Sair
          </button>
        </div>
      )}
    </div>
  )
}
