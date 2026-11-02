import { agendarSalvarRascunho, carregarRascunho, chaveComEscopo, removerRascunho, salvarRascunho } from '@/lib/rascunhoDb'

const STORE = 'processos'
const DEBOUNCE_MS = 800

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

export async function carregarRascunhoProcesso<T>(
  chave: string,
): Promise<(RascunhoProcesso<T> & { salvoEm: number | null }) | null> {
  const registro = await carregarRascunho<RascunhoGravado<T>>(STORE, chave)
  const gravado = registro?.dados
  if (!gravado || gravado.versao !== VERSAO_RASCUNHO) return null
  return { etapaAtual: gravado.etapaAtual, valores: gravado.valores, salvoEm: registro.salvoEm }
}

export function removerRascunhoProcesso(chave: string): Promise<void> {
  return removerRascunho(STORE, chave)
}

export function agendarSalvarRascunhoProcesso<T>(chave: string, rascunho: RascunhoProcesso<T>): void {
  agendarSalvarRascunho(STORE, chave, comVersao(rascunho), DEBOUNCE_MS)
}
