// Rascunho local do formulário de animal em IndexedDB nativo (sem
// dependência) — exigência de negócio para formulários longos
// ("cadastro de animal"), já que a rede do CCZ é instável e o form não pode
// perder dados preenchidos numa queda de conexão. O banco é compartilhado
// com os outros rascunhos (lib/rascunhoDb.ts).
import { carregarRascunho, removerRascunho, salvarRascunho } from '@/lib/rascunhoDb'

const STORE = 'animais'
const DEBOUNCE_MS = 800

export function chaveRascunhoAnimal(id: string | undefined): string {
  return id ? `editar:${id}` : 'novo'
}

export function salvarRascunhoAnimal<T>(chave: string, valores: T): Promise<void> {
  return salvarRascunho(STORE, chave, valores)
}

export function carregarRascunhoAnimal<T>(chave: string): Promise<T | null> {
  return carregarRascunho<T>(STORE, chave)
}

export function removerRascunhoAnimal(chave: string): Promise<void> {
  return removerRascunho(STORE, chave)
}

const timeoutsAgendados = new Map<string, ReturnType<typeof setTimeout>>()

// Debounce por chave: evita gravar no IndexedDB a cada tecla digitada.
export function agendarSalvarRascunhoAnimal<T>(chave: string, valores: T): void {
  const timeoutAnterior = timeoutsAgendados.get(chave)
  if (timeoutAnterior) clearTimeout(timeoutAnterior)

  const novoTimeout = setTimeout(() => {
    timeoutsAgendados.delete(chave)
    void salvarRascunhoAnimal(chave, valores)
  }, DEBOUNCE_MS)
  timeoutsAgendados.set(chave, novoTimeout)
}
