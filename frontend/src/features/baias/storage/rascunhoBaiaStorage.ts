// Rascunho do modal de baia, na store 'clinico' do banco compartilhado
// (lib/rascunhoDb.ts), junto dos modais clínicos.
import { armazenamentoRascunho, chaveComEscopo } from '@/lib/rascunhoDb'

const DEBOUNCE_MS = 800

// '<usuarioId>:baia:<novo|id>'
export function chaveRascunhoBaia(usuarioId: string, baiaId: string | undefined): string {
  return chaveComEscopo(usuarioId, `baia:${baiaId ?? 'novo'}`)
}

export function armazenamentoRascunhoBaia<T>() {
  return armazenamentoRascunho<T>('clinico', DEBOUNCE_MS)
}
