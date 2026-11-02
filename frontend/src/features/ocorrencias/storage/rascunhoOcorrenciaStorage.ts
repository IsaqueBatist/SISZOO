import {
  agendarSalvarRascunho,
  cancelarSalvamentoAgendado,
  carregarRascunho,
  chaveComEscopo,
  removerRascunho,
  salvarRascunho,
  type RegistroRascunho,
} from '@/lib/rascunhoDb'

const STORE = 'ocorrencias'
const DEBOUNCE_MS = 800

export function chaveRascunhoOcorrencia(usuarioId: string, id: string | undefined): string {
  return chaveComEscopo(usuarioId, id ? `editar:${id}` : 'novo')
}

export function salvarRascunhoOcorrencia<T>(valores: T, chave: string): Promise<void> {
  return salvarRascunho(STORE, chave, valores)
}

export function carregarRascunhoOcorrencia<T>(chave: string): Promise<RegistroRascunho<T> | null> {
  return carregarRascunho<T>(STORE, chave)
}

export function removerRascunhoOcorrencia(chave: string): Promise<void> {
  return removerRascunho(STORE, chave)
}

export function agendarSalvarRascunhoOcorrencia<T>(valores: T, chave: string): void {
  agendarSalvarRascunho(STORE, chave, valores, DEBOUNCE_MS)
}

export function cancelarRascunhoAgendadoOcorrencia(chave: string): void {
  cancelarSalvamentoAgendado(STORE, chave)
}

export interface AnexosPendentesOcorrencia {
  ocorrenciaId: string
  protocolo: string
  anexos: File[]
}

function chaveAnexosPendentes(usuarioId: string): string {
  return chaveComEscopo(usuarioId, 'anexos-pendentes')
}

export function salvarAnexosPendentes(usuarioId: string, pendencia: AnexosPendentesOcorrencia): Promise<void> {
  return salvarRascunho(STORE, chaveAnexosPendentes(usuarioId), pendencia)
}

export async function carregarAnexosPendentes(usuarioId: string): Promise<AnexosPendentesOcorrencia | null> {
  const registro = await carregarRascunho<AnexosPendentesOcorrencia>(STORE, chaveAnexosPendentes(usuarioId))
  return registro?.dados ?? null
}

export function removerAnexosPendentes(usuarioId: string): Promise<void> {
  return removerRascunho(STORE, chaveAnexosPendentes(usuarioId))
}
