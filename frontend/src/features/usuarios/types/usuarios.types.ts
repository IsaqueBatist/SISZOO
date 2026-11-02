import type { Usuario } from '@/features/auth/types/auth.types'

export type PerfilUsuario = 'Administrador' | 'Veterinário' | 'Agente Sanitário'

export const PERFIS_USUARIO: PerfilUsuario[] = ['Administrador', 'Veterinário', 'Agente Sanitário']

export type UsuarioListItem = Usuario & {
  ativo: boolean
  ultimoAcesso: string | null
  criadoEm: string
  crmv: string | null
  telefone: string | null
}

export interface CriarUsuarioRequest {
  nome: string
  sobrenome: string
  email: string
  cargo: PerfilUsuario
  crmv?: string
  senhaInicial: string
}

export interface AtualizarUsuarioRequest {
  nome: string
  sobrenome: string
  cargo: PerfilUsuario
  crmv?: string
  telefone?: string
}

export interface PaginaResponse<T> {
  itens: T[]
  pagina: number
  tamanho: number
  totalItens: number
  totalPaginas: number
}
