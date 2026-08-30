import type { Usuario } from '../auth/auth.types'

export type PerfilUsuario = 'Administrador' | 'Veterinário' | 'Agente Sanitário'

export const PERFIS_USUARIO: PerfilUsuario[] = ['Administrador', 'Veterinário', 'Agente Sanitário']

export type UsuarioListItem = Usuario & {
  ativo: boolean
  ultimoAcesso: string | null
  criadoEm: string
  crmv: string | null
}

export interface CriarUsuarioRequest {
  nome: string
  sobrenome: string
  email: string
  cargo: PerfilUsuario
  crmv?: string
  senhaInicial: string
}

// Espelha comum/dto/PaginaResponse do backend — envelope de paginação
// reaproveitado por todo endpoint de listagem.
export interface PaginaResponse<T> {
  itens: T[]
  pagina: number
  tamanho: number
  totalItens: number
  totalPaginas: number
}
