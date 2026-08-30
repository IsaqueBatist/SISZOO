// Contrato provisório — alinhar com T09 quando o backend de login existir.
// cargos é uma lista (não um perfil único) porque o schema real (migration
// V2__schema_usuarios.sql) relaciona usuário e cargo N:N via usuario_cargo.

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
}

export interface TrocarSenhaResponse {
  senhaAlteradaEm: string
}
