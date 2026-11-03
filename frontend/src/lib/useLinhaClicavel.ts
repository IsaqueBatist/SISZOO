import { useCallback, type MouseEvent } from 'react'
import { useNavigate } from 'react-router-dom'

const SELETOR_INTERATIVO =
  'a, button, input, select, textarea, label, summary, details, [role="menu"], [role="menuitem"], [role="dialog"], [data-sem-clique-linha]'

function cliqueEmControleInterno(evento: MouseEvent<HTMLElement>): boolean {
  const alvo = evento.target as Element | null
  if (!alvo || !evento.currentTarget.contains(alvo)) return true
  const controle = alvo.closest(SELETOR_INTERATIVO)
  return !!controle && evento.currentTarget.contains(controle) && controle !== evento.currentTarget
}

function haTextoSelecionado(): boolean {
  return (window.getSelection?.()?.toString().length ?? 0) > 0
}

export interface PropsLinhaClicavel {
  className: string
  onClick: (evento: MouseEvent<HTMLElement>) => void
}

export function useLinhaClicavel() {
  const navigate = useNavigate()

  return useCallback(
    (destino: string | (() => void)): PropsLinhaClicavel => ({
      className: 'linha-clicavel',
      onClick: (evento) => {
        if (evento.defaultPrevented || cliqueEmControleInterno(evento) || haTextoSelecionado()) return
        if (typeof destino === 'string') navigate(destino)
        else destino()
      },
    }),
    [navigate],
  )
}
