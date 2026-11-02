import axios, { isAxiosError } from 'axios'
import type { LoginResponse } from '@/features/auth/types/auth.types'
import { API_BASE_URL } from '../env'
import { houveAtividadeDesdeExtensao, registrarExtensao } from './atividade'

export const EVENTO_SESSAO_RENOVADA = 'auth:renovada'

const NOME_TRAVA = 'siszoo-renovacao'

const clienteSessao = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { 'X-SISZOO-Sessao': '1' },
})

let renovacaoEmAndamento: Promise<LoginResponse> | null = null

function comTravaEntreAbas<T>(acao: () => Promise<T>): Promise<T> {
  if (typeof navigator !== 'undefined' && navigator.locks) {
    return navigator.locks.request(NOME_TRAVA, acao) as Promise<T>
  }
  return acao()
}

export function renovarSessao(houveAtividade = houveAtividadeDesdeExtensao()): Promise<LoginResponse> {
  renovacaoEmAndamento ??= comTravaEntreAbas(async () => {
    const { data } = await clienteSessao.post<LoginResponse>('/auth/renovar', { houveAtividade })
    if (houveAtividade) registrarExtensao()
    window.dispatchEvent(new CustomEvent<LoginResponse>(EVENTO_SESSAO_RENOVADA, { detail: data }))
    return data
  }).finally(() => {
    renovacaoEmAndamento = null
  })
  return renovacaoEmAndamento
}

export function sessaoRecusada(erro: unknown): boolean {
  if (!isAxiosError(erro)) return false
  const status = erro.response?.status
  return status === 401 || status === 403
}

export async function encerrarNoServidor() {
  try {
    await clienteSessao.post('/auth/logout')
  } catch {
  }
}
