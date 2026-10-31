import axios, { isCancel, type InternalAxiosRequestConfig } from 'axios'
import type { LoginResponse } from '@/features/auth/types/auth.types'
import { API_BASE_URL } from './env'
import { EVENTO_SESSAO_RENOVADA, renovarSessao, sessaoRecusada } from './sessao/renovacao'
import { tokenPertoDeVencer } from './sessao/token'

// T42: o MDN avisa que `navigator.onLine === true` não garante acesso real à
// internet, então o aviso de conexão não pode depender só dele. Uma requisição
// que morre sem resposta (erro de rede ou timeout) é o sinal mais confiável de
// que a rede caiu, e uma resposta qualquer é prova de que voltou. Mesma
// convenção de evento em `window` já usada para 'auth:unauthorized'.
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
  return url === '/auth/login'
}

// Token prestes a vencer: renova antes de enviar, para a requisição não voltar
// com 401 à toa. Se a renovação falhar, segue com o token atual e o tratamento
// do 401 decide.
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

// O token de acesso dura pouco: 401 quase sempre quer dizer só que ele venceu.
// Renova (uma vez, mesmo com vários 401 em paralelo) e repete a requisição.
// Sessão recusada pelo servidor encerra; sem resposta, é queda de rede, e a
// sessão fica como está.
async function tentarDeNovoComSessaoRenovada(config: RequisicaoRepetivel, erroOriginal: unknown) {
  try {
    await renovarSessao()
  } catch (erro) {
    if (sessaoRecusada(erro)) window.dispatchEvent(new Event('auth:unauthorized'))
    return Promise.reject(erroOriginal)
  }
  return http({ ...config, repetida: true } as RequisicaoRepetivel)
}

// Endpoints que só existiam como mock (MSW) até existir backend real — hoje
// login, troca de senha e CRUD de usuários já são reais (módulo usuarios),
// então um 401 deles já reflete sessão expirada/inválida de verdade. Mantido
// vazio como ponto de extensão para o próximo módulo que nascer só mockado.
const ENDPOINTS_AINDA_SO_MOCKADOS: string[] = []

http.interceptors.response.use(
  (response) => {
    window.dispatchEvent(new Event(EVENTO_REDE_OK))
    return response
  },
  (error) => {
    const url: string = error.config?.url ?? ''
    const isEndpointAindaSoMockado = ENDPOINTS_AINDA_SO_MOCKADOS.some((endpoint) => url.startsWith(endpoint))
    if (error.response?.status === 401 && !ehRotaDeSessao(url) && !isEndpointAindaSoMockado) {
      window.dispatchEvent(new Event(EVENTO_REDE_OK))
      if ((error.config as RequisicaoRepetivel).repetida) {
        window.dispatchEvent(new Event('auth:unauthorized'))
        return Promise.reject(error)
      }
      return tentarDeNovoComSessaoRenovada(error.config as RequisicaoRepetivel, error)
    }
    // Resposta recebida = rede funcionando, mesmo que o status seja de erro.
    // Sem resposta = rede caiu ou estourou o tempo. Cancelamento não conta: o
    // TanStack Query cancela requisição ao desmontar a tela, e isso não é
    // falha de rede.
    if (error.response) {
      window.dispatchEvent(new Event(EVENTO_REDE_OK))
    } else if (!isCancel(error)) {
      window.dispatchEvent(new Event(EVENTO_REDE_FALHA))
    }
    return Promise.reject(error)
  },
)
