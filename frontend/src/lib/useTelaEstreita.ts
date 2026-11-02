import { useSyncExternalStore } from 'react'

const CONSULTA_TELA_ESTREITA = '(max-width: 768px)'

function assinar(aoMudar: () => void) {
  const consulta = window.matchMedia?.(CONSULTA_TELA_ESTREITA)
  consulta?.addEventListener('change', aoMudar)
  return () => consulta?.removeEventListener('change', aoMudar)
}

export function useTelaEstreita(): boolean {
  return useSyncExternalStore(assinar, () => window.matchMedia?.(CONSULTA_TELA_ESTREITA).matches ?? false)
}
