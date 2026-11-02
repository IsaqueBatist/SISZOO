import axios, { isCancel, type InternalAxiosRequestConfig } from 'axios'
import type { LoginResponse } from '@/features/auth/types/auth.types'
import { API_BASE_URL } from './env'
import { EVENTO_SESSAO_RENOVADA, renovarSessao, sessaoRecusada } from './sessao/renovacao'
import { tokenPertoDeVencer } from './sessao/token'

export const EVENTO_REDE_FALHA = 'rede:falha'
export const EVENTO_REDE_OK = 'rede:ok'

export const http = axios.create({ baseURL: API_BASE_URL })

let authToken: string | null = null

export function setAuthToken(token: string | null) {
  authToken = token
}

window.addEventListener(EVENTO_SESSAO_RENOVADA, (evento) => {
  setAuthToken((evento as CustomEvent<LoginResponse>).detail.token)
})

function ehRotaDeSessao(url: string) {
  return url === '/auth/login' || url.startsWith('/auth/recuperacao')
}

http.interceptors.request.use(async (config) => {
  if (authToken && !ehRotaDeSessao(config.url ?? '') && tokenPertoDeVencer(authToken)) {
    await renovarSessao().catch(() => undefined)
  }
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`
  }
  return config
})

interface RequisicaoRepetivel extends InternalAxiosRequestConfig {
  repetida?: boolean
}

async function tentarDeNovoComSessaoRenovada(config: RequisicaoRepetivel, erroOriginal: unknown) {
  try {
    await renovarSessao()
  } catch (erro) {
    if (sessaoRecusada(erro)) window.dispatchEvent(new Event('auth:unauthorized'))
    return Promise.reject(erroOriginal)
  }
  return http({ ...config, repetida: true } as RequisicaoRepetivel)
}

http.interceptors.response.use(
  (response) => {
    window.dispatchEvent(new Event(EVENTO_REDE_OK))
    return response
  },
  (error) => {
    const url: string = error.config?.url ?? ''
    if (error.response?.status === 401 && !ehRotaDeSessao(url)) {
      window.dispatchEvent(new Event(EVENTO_REDE_OK))
      if ((error.config as RequisicaoRepetivel).repetida) {
        window.dispatchEvent(new Event('auth:unauthorized'))
        return Promise.reject(error)
      }
      return tentarDeNovoComSessaoRenovada(error.config as RequisicaoRepetivel, error)
    }
    if (error.response) {
      window.dispatchEvent(new Event(EVENTO_REDE_OK))
    } else if (!isCancel(error)) {
      window.dispatchEvent(new Event(EVENTO_REDE_FALHA))
    }
    return Promise.reject(error)
  },
)
