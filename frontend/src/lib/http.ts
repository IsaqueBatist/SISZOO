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

// Endpoints que só existem como mock (MSW) até o momento — o backend real
// ainda não os implementa, então um 401 deles é o proxy padrão do Spring
// mascarando uma rota inexistente, não uma sessão inválida de verdade.
// Remover cada entrada daqui assim que o endpoint correspondente existir
// de fato no backend (o 401 passará a refletir sessão expirada/inválida).
const ENDPOINTS_AINDA_SO_MOCKADOS = ['/usuarios', '/auth/senha']

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
