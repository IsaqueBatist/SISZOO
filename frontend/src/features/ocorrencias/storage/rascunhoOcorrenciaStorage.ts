// Rascunho local do formulário de cadastro de ocorrência em IndexedDB nativo
// (banco compartilhado com os outros rascunhos, lib/rascunhoDb.ts) —
// exigência de negócio para formulários longos ("cadastro de ocorrência"), já
// que a rede do CCZ é instável. Chave fixa ('novo') para o cadastro.
import { carregarRascunho, removerRascunho, salvarRascunho } from '@/lib/rascunhoDb'

const STORE = 'ocorrencias'
const DEBOUNCE_MS = 800
const CHAVE_RASCUNHO = 'novo'

export function salvarRascunhoOcorrencia<T>(valores: T): Promise<void> {
  return salvarRascunho(STORE, CHAVE_RASCUNHO, valores)
}

export function carregarRascunhoOcorrencia<T>(): Promise<T | null> {
  return carregarRascunho<T>(STORE, CHAVE_RASCUNHO)
}

export function removerRascunhoOcorrencia(): Promise<void> {
  return removerRascunho(STORE, CHAVE_RASCUNHO)
}

let timeoutAgendado: ReturnType<typeof setTimeout> | null = null

// Debounce: evita gravar no IndexedDB a cada tecla digitada/anexo adicionado.
export function agendarSalvarRascunhoOcorrencia<T>(valores: T): void {
  if (timeoutAgendado) clearTimeout(timeoutAgendado)
  timeoutAgendado = setTimeout(() => {
    timeoutAgendado = null
    void salvarRascunhoOcorrencia(valores)
  }, DEBOUNCE_MS)
}
