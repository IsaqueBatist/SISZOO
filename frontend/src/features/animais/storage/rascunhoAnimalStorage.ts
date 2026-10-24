// Rascunho local do formulário de animal em IndexedDB nativo (sem
// dependência) — exigência de negócio para formulários longos
// ("cadastro de animal"), já que a rede do CCZ é instável e o form não pode
// perder dados preenchidos numa queda de conexão. O banco é compartilhado
// com os outros rascunhos (lib/rascunhoDb.ts).
import {
  agendarSalvarRascunho,
  cancelarSalvamentoAgendado,
  carregarRascunho,
  chaveComEscopo,
  removerRascunho,
  salvarRascunho,
  type RegistroRascunho,
} from '@/lib/rascunhoDb'

const STORE = 'animais'
const DEBOUNCE_MS = 800

export function chaveRascunhoAnimal(usuarioId: string, id: string | undefined): string {
  return chaveComEscopo(usuarioId, id ? `editar:${id}` : 'novo')
}

export function salvarRascunhoAnimal<T>(chave: string, valores: T): Promise<void> {
  return salvarRascunho(STORE, chave, valores)
}

// Devolve o registro completo (valores + instante do salvamento, T42), que é
// o que o aviso de restauração precisa para dizer de quando é o rascunho.
export function carregarRascunhoAnimal<T>(chave: string): Promise<RegistroRascunho<T> | null> {
  return carregarRascunho<T>(STORE, chave)
}

export function removerRascunhoAnimal(chave: string): Promise<void> {
  return removerRascunho(STORE, chave)
}

// Debounce por chave: evita gravar no IndexedDB a cada tecla digitada.
export function agendarSalvarRascunhoAnimal<T>(chave: string, valores: T): void {
  agendarSalvarRascunho(STORE, chave, valores, DEBOUNCE_MS)
}

// Depois do envio com sucesso: o salvamento ainda agendado regravaria o
// rascunho que acabou de ser removido.
export function cancelarSalvamentoRascunhoAnimal(chave: string): void {
  cancelarSalvamentoAgendado(STORE, chave)
}
