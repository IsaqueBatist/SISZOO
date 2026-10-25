// Espelha com.siszoo.usuarios.entity.AcaoAuditoria do backend (e o CHECK
// ck_auditoria_evento_acao, V27). Valor novo no enum Java exige entrada aqui
// e em DESCRICOES (descricaoAcao.ts), senão a tela de Logs quebra.
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

// Espelha com.siszoo.usuarios.dto.AuditoriaEventoResponse.
export interface EventoAuditoria {
  id: string
  usuarioEmail: string | null
  acao: AcaoAuditoria
  entidade: string
  entidadeId: string | null
  ocorreuEm: string
  // F2-027: estado antes/depois (JSON serializado pelo backend); opcionais.
  payloadAntes?: string | null
  payloadDepois?: string | null
}

// F2-027: filtros aplicados no servidor (GET /api/auditoria?acao=&entidade=&usuarioEmail=&modulo=&de=&ate=).
export interface FiltrosAuditoria {
  acao?: string
  entidade?: string
  usuarioEmail?: string
  modulo?: string
  de?: string
  ate?: string
}

// Espelha com.siszoo.usuarios.dto.OpcoesFiltroAuditoriaResponse (GET /api/auditoria/filtros).
export interface OpcoesFiltroAuditoria {
  acoes: AcaoAuditoria[]
  entidades: string[]
  usuarios: string[]
  modulos: string[]
}
