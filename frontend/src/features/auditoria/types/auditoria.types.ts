// Espelha com.siszoo.usuarios.entity.AcaoAuditoria do backend. O DER
// (docs/modulo1-usuarios-acesso.dbml) lista só 8 valores — falta
// VISUALIZACAO (T26/V12, acesso a denunciante de ocorrência sigilosa),
// presente no enum Java real. Não corrigido aqui (fora do escopo deste PR,
// que é só frontend) — ver docs/pendencias-documentacao.md.
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
