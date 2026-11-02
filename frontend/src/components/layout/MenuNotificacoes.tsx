import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useResumoNotificacoes, type NotificacaoResumo } from '@/features/alertas/hooks/useResumoNotificacoes'
import { Icon, type IconName } from './Icon'
import { useClickOutside } from './useClickOutside'

const ICONE_POR_TOM: Record<NotificacaoResumo['tom'], IconName> = {
  danger: 'alert',
  warning: 'alert',
  'alert-yellow': 'alert',
  info: 'bell',
}

export function MenuNotificacoes() {
  const { itens, total, carregando } = useResumoNotificacoes()
  const [aberto, setAberto] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const botaoRef = useRef<HTMLButtonElement>(null)
  const primeiroItemRef = useRef<HTMLAnchorElement>(null)

  const fechar = useCallback(() => {
    setAberto(false)
    botaoRef.current?.focus()
  }, [])

  useClickOutside(containerRef, fechar, aberto)

  useEffect(() => {
    if (aberto) primeiroItemRef.current?.focus()
  }, [aberto])

  const rotulo = total === 0 ? 'Notificações' : `Notificações: ${total} alerta${total === 1 ? '' : 's'}`

  return (
    <div className="menu-notificacoes" ref={containerRef}>
      <button
        ref={botaoRef}
        type="button"
        className="icon-btn"
        title="Notificações"
        aria-label={rotulo}
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
        <Icon name="bell" />
        {total > 0 && <span className="dot" aria-hidden="true" />}
      </button>

      {aberto && (
        <div className="menu-notificacoes-popover" role="menu" aria-label="Notificações">
          <div className="dd-header">
            <span>Notificações</span>
            {total > 0 && <span className="dd-header-contagem">{total}</span>}
          </div>

          {carregando && <div className="dd-vazio">Carregando…</div>}

          {!carregando && itens.length === 0 && <div className="dd-vazio">Nenhum alerta no momento.</div>}

          {itens.map((item, indice) => {
            const conteudo = (
              <>
                <span className={`dd-notif-ico tom-${item.tom}`}>
                  <Icon name={ICONE_POR_TOM[item.tom]} size={14} />
                </span>
                <div>
                  <div className="dd-notif-title">{item.titulo}</div>
                  <div className="dd-notif-desc">{item.descricao}</div>
                </div>
              </>
            )
            const classe = `dd-notif-item${item.urgente ? ' urgent' : ''}`

            return item.para ? (
              <Link
                key={item.id}
                ref={indice === 0 ? primeiroItemRef : undefined}
                to={item.para}
                role="menuitem"
                className={classe}
                onClick={fechar}
              >
                {conteudo}
              </Link>
            ) : (
              <div key={item.id} role="menuitem" className={classe}>
                {conteudo}
              </div>
            )
          })}

          <div className="dd-foot">
            <Link to="/dashboard" onClick={fechar}>
              Ver no dashboard →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
