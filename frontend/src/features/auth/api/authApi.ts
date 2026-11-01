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
  // withCredentials: a resposta traz o cookie httpOnly da sessão.
  return http.post<LoginResponse>('/auth/login', payload, { withCredentials: true }).then((response) => response.data)
}

// Backend responde 204 sem corpo (ver AuthController.trocarSenha): quem
// chama já sabe, no momento da chamada, que a troca foi bem-sucedida.
export function trocarSenha(payload: TrocarSenhaRequest): Promise<void> {
  return http.post('/auth/senha', payload).then(() => undefined)
}

// Recuperação de senha (sem sessão). A API responde 202 para qualquer e-mail
// institucional, cadastrado ou não.
export function solicitarRecuperacaoSenha(payload: SolicitarRecuperacaoSenhaRequest): Promise<void> {
  return http.post('/auth/recuperacao', payload).then(() => undefined)
}

// 204 quando o link ainda vale; 410 quando venceu, já foi usado ou não existe.
export function validarTokenRecuperacao(payload: ValidarTokenRecuperacaoRequest): Promise<void> {
  return http.post('/auth/recuperacao/validar', payload).then(() => undefined)
}

export function redefinirSenhaComToken(payload: RedefinirSenhaComTokenRequest): Promise<void> {
  return http.post('/auth/recuperacao/redefinir', payload).then(() => undefined)
}
