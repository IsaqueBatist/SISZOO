import { http } from '@/lib/http'
import type {
  LoginRequest,
  LoginResponse,
  RedefinirSenhaComTokenRequest,
  SolicitarRecuperacaoSenhaRequest,
  TrocarSenhaRequest,
  ValidarTokenRecuperacaoRequest,
} from '../types/auth.types'

export function login(payload: LoginRequest): Promise<LoginResponse> {
  return http.post<LoginResponse>('/auth/login', payload, { withCredentials: true }).then((response) => response.data)
}

export function trocarSenha(payload: TrocarSenhaRequest): Promise<void> {
  return http.post('/auth/senha', payload).then(() => undefined)
}

export function solicitarRecuperacaoSenha(payload: SolicitarRecuperacaoSenhaRequest): Promise<void> {
  return http.post('/auth/recuperacao', payload).then(() => undefined)
}

export function validarTokenRecuperacao(payload: ValidarTokenRecuperacaoRequest): Promise<void> {
  return http.post('/auth/recuperacao/validar', payload).then(() => undefined)
}

export function redefinirSenhaComToken(payload: RedefinirSenhaComTokenRequest): Promise<void> {
  return http.post('/auth/recuperacao/redefinir', payload).then(() => undefined)
}
