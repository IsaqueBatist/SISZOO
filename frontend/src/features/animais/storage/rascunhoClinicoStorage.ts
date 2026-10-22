// Rascunho dos modais clínicos (vacina, procedimento, prescrição) na store
// 'clinico' do banco compartilhado (lib/rascunhoDb.ts). Um rascunho por
// usuário, tipo e animal — e, na correção, também pelo registro corrigido,
// para não misturar a correção com um registro novo do mesmo animal.
import { armazenamentoRascunho, chaveComEscopo } from '@/lib/rascunhoDb'

const DEBOUNCE_MS = 800

export type TipoRascunhoClinico = 'vacina' | 'procedimento' | 'prescricao' | 'exame'

// '<usuarioId>:<tipo>:<animalId>[:<retificaId>]'
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
