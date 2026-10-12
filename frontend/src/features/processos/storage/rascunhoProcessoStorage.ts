// Rascunho local do wizard de processo sanitário em IndexedDB nativo (banco
// compartilhado com os outros rascunhos, lib/rascunhoDb.ts) — exigência de
// negócio para formulários longos ("wizard de processo"), já que a rede do
// CCZ é instável. T32 não inclui edição de processo existente, então há uma
// única chave por usuário ('<usuarioId>:novo'), igual ao rascunho de ocorrência.
//
// O objeto salvo também guarda `etapaAtual` e `ocorrenciaId`/`vinculoDecisao`
// (via RascunhoProcesso<T>) para que o rascunho restaurado reabra na etapa
// certa e com o vínculo da RN2 respeitado — não é só o formulário puro.
import { agendarSalvarRascunho, carregarRascunho, chaveComEscopo, removerRascunho, salvarRascunho } from '@/lib/rascunhoDb'

const STORE = 'processos'
const DEBOUNCE_MS = 800

export interface RascunhoProcesso<T> {
  etapaAtual: 1 | 2 | 3 | 4
  valores: T
}

export function chaveRascunhoProcesso(usuarioId: string): string {
  return chaveComEscopo(usuarioId, 'novo')
}

export function salvarRascunhoProcesso<T>(chave: string, valores: RascunhoProcesso<T>): Promise<void> {
  return salvarRascunho(STORE, chave, valores)
}

export function carregarRascunhoProcesso<T>(chave: string): Promise<RascunhoProcesso<T> | null> {
  return carregarRascunho<RascunhoProcesso<T>>(STORE, chave)
}

export function removerRascunhoProcesso(chave: string): Promise<void> {
  return removerRascunho(STORE, chave)
}

// Debounce: evita gravar no IndexedDB a cada tecla digitada. Além disso,
// ProcessoForm.tsx chama `salvarRascunhoProcesso` diretamente (sem debounce)
// a cada troca de etapa, conforme exigido pela tarefa.
export function agendarSalvarRascunhoProcesso<T>(chave: string, valores: RascunhoProcesso<T>): void {
  agendarSalvarRascunho(STORE, chave, valores, DEBOUNCE_MS)
}
