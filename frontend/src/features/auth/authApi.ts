import { http } from '../../lib/http'
import type { LoginRequest, LoginResponse, TrocarSenhaRequest, TrocarSenhaResponse } from './auth.types'

export function login(payload: LoginRequest): Promise<LoginResponse> {
  return http.post<LoginResponse>('/auth/login', payload).then((response) => response.data)
}

export function trocarSenha(payload: TrocarSenhaRequest): Promise<TrocarSenhaResponse> {
  return http.post<TrocarSenhaResponse>('/auth/senha', payload).then((response) => response.data)
}
