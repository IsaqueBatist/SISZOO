import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { Icon } from './layout/Icon'
import { useClickOutside } from './layout/useClickOutside'

export interface AcaoDoMenu {
  rotulo: string
  rotuloAcessivel?: string
  perigo?: boolean
  onSelecionar: () => void
}

interface MenuAcoesProps {
  rotulo: string
  acoes: AcaoDoMenu[]
}

const ALTURA_ESTIMADA_ITEM = 34

export function MenuAcoes({ rotulo, acoes }: MenuAcoesProps) {
  const [aberto, setAberto] = useState(false)
  const [posicao, setPosicao] = useState<CSSProperties>({})
  const containerRef = useRef<HTMLDivElement>(null)
  const botaoRef = useRef<HTMLButtonElement>(null)
  const itensRef = useRef<(HTMLButtonElement | null)[]>([])

  const fechar = useCallback(() => {
    setAberto(false)
    botaoRef.current?.focus()
  }, [])

  useClickOutside(containerRef, fechar, aberto)

  useLayoutEffect(() => {
    if (!aberto || !botaoRef.current) return
    const caixa = botaoRef.current.getBoundingClientRect()
    const alturaMenu = acoes.length * ALTURA_ESTIMADA_ITEM + 8
    const abreParaCima = caixa.bottom + alturaMenu > window.innerHeight && caixa.top > alturaMenu
    setPosicao({
      right: Math.max(8, window.innerWidth - caixa.right),
      ...(abreParaCima ? { bottom: window.innerHeight - caixa.top + 4 } : { top: caixa.bottom + 4 }),
    })
  }, [aberto, acoes.length])

  useEffect(() => {
    if (!aberto) return
    itensRef.current[0]?.focus()
    const aoRolar = () => setAberto(false)
    window.addEventListener('scroll', aoRolar, true)
    window.addEventListener('resize', aoRolar)
    return () => {
      window.removeEventListener('scroll', aoRolar, true)
      window.removeEventListener('resize', aoRolar)
    }
  }, [aberto])

  function moverFoco(evento: KeyboardEvent<HTMLDivElement>) {
    const itens = itensRef.current.filter((item): item is HTMLButtonElement => item !== null)
    const atual = itens.indexOf(document.activeElement as HTMLButtonElement)
    const destinos: Record<string, number> = {
      ArrowDown: (atual + 1) % itens.length,
      ArrowUp: (atual - 1 + itens.length) % itens.length,
      Home: 0,
      End: itens.length - 1,
    }
    if (evento.key in destinos) {
      evento.preventDefault()
      itens[destinos[evento.key]]?.focus()
    } else if (evento.key === 'Tab') {
      setAberto(false)
    }
  }

  return (
    <div className="menu-acoes" ref={containerRef}>
      <button
        ref={botaoRef}
        type="button"
        className="btn btn-ghost btn-sm btn-icon-only"
        aria-label={rotulo}
        title={rotulo}
        aria-haspopup="menu"
        aria-expanded={aberto}
        onClick={() => setAberto((valor) => !valor)}
      >
        <Icon name="more" size={16} />
      </button>
      {aberto && (
        <div className="menu-acoes-popover" role="menu" aria-label={rotulo} style={posicao} onKeyDown={moverFoco}>
          {acoes.map((acao, indice) => (
            <button
              key={acao.rotulo}
              ref={(elemento) => {
                itensRef.current[indice] = elemento
              }}
              type="button"
              role="menuitem"
              className={`menu-acoes-item${acao.perigo ? ' perigo' : ''}`}
              aria-label={acao.rotuloAcessivel}
              tabIndex={-1}
              onClick={() => {
                setAberto(false)
                acao.onSelecionar()
              }}
            >
              {acao.rotulo}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
