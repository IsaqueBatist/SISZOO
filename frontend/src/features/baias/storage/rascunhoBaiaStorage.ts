import { armazenamentoRascunho, chaveComEscopo } from '@/lib/rascunhoDb'

const DEBOUNCE_MS = 800

export function chaveRascunhoBaia(usuarioId: string, baiaId: string | undefined): string {
  return chaveComEscopo(usuarioId, `baia:${baiaId ?? 'novo'}`)
}

export function armazenamentoRascunhoBaia<T>() {
  return armazenamentoRascunho<T>('clinico', DEBOUNCE_MS)
}
