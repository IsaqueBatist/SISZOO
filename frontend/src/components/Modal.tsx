import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from 'react'
import { Icon } from './layout/Icon'

const SELETOR_FOCAVEL = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

interface ModalProps {
  titulo: ReactNode
  onFechar: () => void
  children: ReactNode
}

// Diálogo único da aplicação (.modal): anuncia título, leva o foco para dentro,
// mantém o Tab no diálogo, fecha com Esc e devolve o foco a quem abriu. Clicar
// fora não fecha: um clique perdido não pode encerrar um registro em andamento.
export function Modal({ titulo, onFechar, children }: ModalProps) {
  const idTitulo = useId()
  const dialogo = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const quemAbriu = document.activeElement as HTMLElement | null
    const elemento = dialogo.current
    const corpo = elemento?.querySelector<HTMLElement>('.modal-body')
    const primeiro = corpo?.querySelector<HTMLElement>(SELETOR_FOCAVEL)
    ;(primeiro ?? elemento)?.focus()
    return () => quemAbriu?.focus()
  }, [])

  function aoPressionarTecla(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.stopPropagation()
      onFechar()
      return
    }
    if (event.key !== 'Tab' || !dialogo.current) return

    const focaveis = [...dialogo.current.querySelectorAll<HTMLElement>(SELETOR_FOCAVEL)]
    if (focaveis.length === 0) return
    const primeiro = focaveis[0]
    const ultimo = focaveis[focaveis.length - 1]
    if (event.shiftKey && document.activeElement === primeiro) {
      event.preventDefault()
      ultimo.focus()
    } else if (!event.shiftKey && document.activeElement === ultimo) {
      event.preventDefault()
      primeiro.focus()
    }
  }

  return (
    <div className="modal-overlay" onKeyDown={aoPressionarTecla}>
      <div ref={dialogo} className="modal" role="dialog" aria-modal="true" aria-labelledby={idTitulo} tabIndex={-1}>
        <div className="modal-header">
          <h3 id={idTitulo}>{titulo}</h3>
          <button type="button" className="btn btn-ghost btn-sm btn-icon-only" onClick={onFechar} aria-label="Fechar">
            <Icon name="x" size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
