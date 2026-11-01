import { useSyncExternalStore } from 'react'

export const CONSULTA_TELA_ESTREITA = '(max-width: 768px)'

function assinar(aoMudar: () => void) {
  const consulta = window.matchMedia?.(CONSULTA_TELA_ESTREITA)
  consulta?.addEventListener('change', aoMudar)
  return () => consulta?.removeEventListener('change', aoMudar)
}

// Mesmo limite do CSS em que o menu vira gaveta. Só para o que o CSS não
// alcança, como o rótulo oculto do menu recolhido.
export function useTelaEstreita(): boolean {
  return useSyncExternalStore(assinar, () => window.matchMedia?.(CONSULTA_TELA_ESTREITA).matches ?? false)
}
