import { http } from '../../lib/http'
import type { LoginRequest, LoginResponse, TrocarSenhaRequest } from './auth.types'

export function login(payload: LoginRequest): Promise<LoginResponse> {
  return http.post<LoginResponse>('/auth/login', payload).then((response) => response.data)
}

// Backend responde 204 sem corpo (ver AuthController.trocarSenha) — quem
// chama já sabe, no momento da chamada, que a troca foi bem-sucedida.
export function trocarSenha(payload: TrocarSenhaRequest): Promise<void> {
  return http.post('/auth/senha', payload).then(() => undefined)
}
