// Rascunho local do wizard de processo sanitário em IndexedDB nativo (banco
// compartilhado com os outros rascunhos, lib/rascunhoDb.ts) — exigência de
// negócio para formulários longos ("wizard de processo"), já que a rede do
// CCZ é instável. Não há edição de processo existente, então há uma única
// chave por usuário ('<usuarioId>:novo'), igual ao rascunho de ocorrência.
//
// O objeto salvo também guarda `etapaAtual` para que o rascunho restaurado
// reabra na etapa certa e com o vínculo da RN2 respeitado.
import { agendarSalvarRascunho, carregarRascunho, chaveComEscopo, removerRascunho, salvarRascunho } from '@/lib/rascunhoDb'

const STORE = 'processos'
const DEBOUNCE_MS = 800

// T29: o formulário passou a usar o contrato da API real (enums em
// maiúsculas, espécie por código, amostra do canil só com animalId). Um
// rascunho de versão anterior (o do mock) não é restaurado: os valores seriam
// recusados pelo backend.
const VERSAO_RASCUNHO = 2

export interface RascunhoProcesso<T> {
  etapaAtual: 1 | 2 | 3 | 4
  valores: T
}

interface RascunhoGravado<T> extends RascunhoProcesso<T> {
  versao: number
}

export function chaveRascunhoProcesso(usuarioId: string): string {
  return chaveComEscopo(usuarioId, 'novo')
}

function comVersao<T>(rascunho: RascunhoProcesso<T>): RascunhoGravado<T> {
  return { ...rascunho, versao: VERSAO_RASCUNHO }
}

export function salvarRascunhoProcesso<T>(chave: string, rascunho: RascunhoProcesso<T>): Promise<void> {
  return salvarRascunho(STORE, chave, comVersao(rascunho))
}

export async function carregarRascunhoProcesso<T>(chave: string): Promise<RascunhoProcesso<T> | null> {
  const gravado = await carregarRascunho<RascunhoGravado<T>>(STORE, chave)
  if (!gravado || gravado.versao !== VERSAO_RASCUNHO) return null
  return { etapaAtual: gravado.etapaAtual, valores: gravado.valores }
}

export function removerRascunhoProcesso(chave: string): Promise<void> {
  return removerRascunho(STORE, chave)
}

// Debounce: evita gravar no IndexedDB a cada tecla digitada. Além disso,
// ProcessoForm.tsx chama `salvarRascunhoProcesso` diretamente (sem debounce)
// a cada troca de etapa.
export function agendarSalvarRascunhoProcesso<T>(chave: string, rascunho: RascunhoProcesso<T>): void {
  agendarSalvarRascunho(STORE, chave, comVersao(rascunho), DEBOUNCE_MS)
}
