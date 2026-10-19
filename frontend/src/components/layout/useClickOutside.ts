import { useEffect } from 'react'
import type { RefObject } from 'react'

// Fecha um popover/menu ao clicar fora dele ou pressionar Esc. `ativo` evita
// registrar os listeners quando o menu já está fechado.
export function useClickOutside(ref: RefObject<HTMLElement | null>, onFechar: () => void, ativo: boolean) {
  useEffect(() => {
    if (!ativo) return

    function aoClicar(evento: MouseEvent) {
      if (ref.current && !ref.current.contains(evento.target as Node)) {
        onFechar()
      }
    }
    function aoPressionarTecla(evento: KeyboardEvent) {
      if (evento.key === 'Escape') onFechar()
    }

    document.addEventListener('mousedown', aoClicar)
    document.addEventListener('keydown', aoPressionarTecla)
    return () => {
      document.removeEventListener('mousedown', aoClicar)
      document.removeEventListener('keydown', aoPressionarTecla)
    }
  }, [ativo, ref, onFechar])
}
