export interface Usuario {
  id: string
  nome: string
  sobrenome: string
  email: string
  cargos: string[]
  senhaAlteradaEm: string | null
}

export interface LoginRequest {
  email: string
  senha: string
}

export interface LoginResponse {
  token: string
  usuario: Usuario
}

export interface TrocarSenhaRequest {
  novaSenha: string
  confirmarSenha: string
}

export interface SolicitarRecuperacaoSenhaRequest {
  email: string
}

export interface ValidarTokenRecuperacaoRequest {
  token: string
}

export interface RedefinirSenhaComTokenRequest {
  token: string
  novaSenha: string
  confirmarSenha: string
}
