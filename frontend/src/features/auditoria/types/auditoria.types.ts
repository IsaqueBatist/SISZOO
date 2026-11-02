export type AcaoAuditoria =
  | 'CRIACAO'
  | 'ATUALIZACAO'
  | 'DESATIVACAO'
  | 'REATIVACAO'
  | 'LOGIN'
  | 'LOGOUT'
  | 'EXPORTACAO'
  | 'ENCERRAMENTO'
  | 'VISUALIZACAO'
  | 'ACESSO_NEGADO'
  | 'SESSAO_REVOGADA'

export interface EventoAuditoria {
  id: string
  usuarioEmail: string | null
  acao: AcaoAuditoria
  entidade: string
  entidadeId: string | null
  ocorreuEm: string
  ip?: string | null
  payloadAntes?: string | null
  payloadDepois?: string | null
}

export interface FiltrosAuditoria {
  acao?: string
  usuarioEmail?: string
  modulo?: string
  de?: string
  ate?: string
}

export interface OpcoesFiltroAuditoria {
  acoes: AcaoAuditoria[]
  usuarios: string[]
  modulos: string[]
}
