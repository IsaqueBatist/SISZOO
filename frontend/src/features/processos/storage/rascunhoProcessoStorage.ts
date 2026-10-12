// Rascunho local do wizard de processo sanitário em IndexedDB nativo (banco
// compartilhado com os outros rascunhos, lib/rascunhoDb.ts) — exigência de
// negócio para formulários longos ("wizard de processo"), já que a rede do
// CCZ é instável. T32 não inclui edição de processo existente, então há uma
// única chave fixa ('novo'), igual ao rascunho de ocorrência.
//
// O objeto salvo também guarda `etapaAtual` e `ocorrenciaId`/`vinculoDecisao`
// (via RascunhoProcesso<T>) para que o rascunho restaurado reabra na etapa
// certa e com o vínculo da RN2 respeitado — não é só o formulário puro.
import { carregarRascunho, removerRascunho, salvarRascunho } from '@/lib/rascunhoDb'

const STORE = 'processos'
const DEBOUNCE_MS = 800
const CHAVE_RASCUNHO = 'novo'

export interface RascunhoProcesso<T> {
  etapaAtual: 1 | 2 | 3 | 4
  valores: T
}

export function salvarRascunhoProcesso<T>(valores: RascunhoProcesso<T>): Promise<void> {
  return salvarRascunho(STORE, CHAVE_RASCUNHO, valores)
}

export function carregarRascunhoProcesso<T>(): Promise<RascunhoProcesso<T> | null> {
  return carregarRascunho<RascunhoProcesso<T>>(STORE, CHAVE_RASCUNHO)
}

export function removerRascunhoProcesso(): Promise<void> {
  return removerRascunho(STORE, CHAVE_RASCUNHO)
}

let timeoutAgendado: ReturnType<typeof setTimeout> | null = null

// Debounce: evita gravar no IndexedDB a cada tecla digitada. Além disso,
// ProcessoForm.tsx chama `salvarRascunhoProcesso` diretamente (sem debounce)
// a cada troca de etapa, conforme exigido pela tarefa.
export function agendarSalvarRascunhoProcesso<T>(valores: RascunhoProcesso<T>): void {
  if (timeoutAgendado) clearTimeout(timeoutAgendado)
  timeoutAgendado = setTimeout(() => {
    timeoutAgendado = null
    void salvarRascunhoProcesso(valores)
  }, DEBOUNCE_MS)
}
