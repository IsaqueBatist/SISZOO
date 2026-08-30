import axios from 'axios'
import { API_BASE_URL } from './env'

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
  (response) => response,
  (error) => {
    const url: string = error.config?.url ?? ''
    const isLoginRequest = url === '/auth/login'
    const isEndpointAindaSoMockado = ENDPOINTS_AINDA_SO_MOCKADOS.some((endpoint) => url.startsWith(endpoint))
    if (error.response?.status === 401 && !isLoginRequest && !isEndpointAindaSoMockado) {
      window.dispatchEvent(new Event('auth:unauthorized'))
    }
    return Promise.reject(error)
  },
)
