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

export function carregarRascunhoAnimal<T>(chave: string): Promise<RegistroRascunho<T> | null> {
  return carregarRascunho<T>(STORE, chave)
}

export function removerRascunhoAnimal(chave: string): Promise<void> {
  return removerRascunho(STORE, chave)
}

export function agendarSalvarRascunhoAnimal<T>(chave: string, valores: T): void {
  agendarSalvarRascunho(STORE, chave, valores, DEBOUNCE_MS)
}

export function cancelarSalvamentoRascunhoAnimal(chave: string): void {
  cancelarSalvamentoAgendado(STORE, chave)
}
