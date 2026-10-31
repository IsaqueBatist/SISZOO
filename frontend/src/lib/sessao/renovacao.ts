import axios, { isAxiosError } from 'axios'
import type { LoginResponse } from '@/features/auth/types/auth.types'
import { API_BASE_URL } from '../env'
import { houveAtividadeDesdeExtensao, registrarExtensao } from './atividade'

export const EVENTO_SESSAO_RENOVADA = 'auth:renovada'

const NOME_TRAVA = 'siszoo-renovacao'

// Cliente próprio, sem os interceptores de `http`: uma falha aqui não pode
// disparar outra renovação. O header força o preflight de CORS, que é o que
// protege estes dois endpoints autenticados por cookie.
const clienteSessao = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { 'X-SISZOO-Sessao': '1' },
})

let renovacaoEmAndamento: Promise<LoginResponse> | null = null

// Uma renovação por vez entre as abas. Sem Web Locks (navegador antigo), o
// servidor ainda aceita o token anterior por alguns segundos.
function comTravaEntreAbas<T>(acao: () => Promise<T>): Promise<T> {
  if (typeof navigator !== 'undefined' && navigator.locks) {
    return navigator.locks.request(NOME_TRAVA, acao) as Promise<T>
  }
  return acao()
}

// Uma renovação por vez nesta aba: vários 401 em paralelo esperam a mesma.
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

// Sem resposta do servidor, a sessão pode muito bem continuar válida: só uma
// recusa dele quer dizer que ela acabou.
export function sessaoRecusada(erro: unknown): boolean {
  if (!isAxiosError(erro)) return false
  const status = erro.response?.status
  return status === 401 || status === 403
}

// Melhor esforço: quem clica em Sair sai da tela de qualquer jeito, e a sessão
// que sobrar no servidor vence por inatividade.
export async function encerrarNoServidor() {
  try {
    await clienteSessao.post('/auth/logout')
  } catch {
    /* sem conexão ou sessão já encerrada */
  }
}
