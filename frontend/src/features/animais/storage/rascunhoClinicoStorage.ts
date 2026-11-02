import { armazenamentoRascunho, chaveComEscopo } from '@/lib/rascunhoDb'

const DEBOUNCE_MS = 800

export type TipoRascunhoClinico = 'vacina' | 'procedimento' | 'prescricao' | 'exame'

export function chaveRascunhoClinico(
  usuarioId: string,
  tipo: TipoRascunhoClinico,
  animalId: string,
  retificaId?: string,
): string {
  return chaveComEscopo(usuarioId, retificaId ? `${tipo}:${animalId}:${retificaId}` : `${tipo}:${animalId}`)
}

export function armazenamentoRascunhoClinico<T>() {
  return armazenamentoRascunho<T>('clinico', DEBOUNCE_MS)
}
