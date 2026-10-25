import axios, { isCancel } from 'axios'
import { API_BASE_URL } from './env'

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

http.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`
  }
  return config
})

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
    const isLoginRequest = url === '/auth/login'
    const isEndpointAindaSoMockado = ENDPOINTS_AINDA_SO_MOCKADOS.some((endpoint) => url.startsWith(endpoint))
    if (error.response?.status === 401 && !isLoginRequest && !isEndpointAindaSoMockado) {
      window.dispatchEvent(new Event('auth:unauthorized'))
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
