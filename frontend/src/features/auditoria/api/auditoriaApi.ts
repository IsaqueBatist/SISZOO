import { http } from '@/lib/http'
import type { PaginaResponse } from '@/features/usuarios/types/usuarios.types'
import type { EventoAuditoria, FiltrosAuditoria, OpcoesFiltroAuditoria } from '../types/auditoria.types'

// GET /api/auditoria (AuditoriaController) — protegido por USUARIOS_ACESSO:leitura,
// exclusivo do Admin (V3__seed_cargos.sql). F2-027 (Fase 3 do TG): os filtros por
// ação/entidade/usuário/módulo/período são aplicados no SERVIDOR (contrato
// docs/contratos/auditoria-filtros.md atendido); parâmetros vazios são omitidos.
export function listarEventosAuditoria(
  pagina: number,
  tamanho: number,
  filtros: FiltrosAuditoria = {},
): Promise<PaginaResponse<EventoAuditoria>> {
  const params: Record<string, string | number> = { pagina, tamanho }
  for (const [chave, valor] of Object.entries(filtros)) {
    if (valor) params[chave] = valor
  }
  return http.get<PaginaResponse<EventoAuditoria>>('/auditoria', { params }).then((r) => r.data)
}

// GET /api/auditoria/filtros — valores distintos de toda a trilha para montar os selects.
export function buscarOpcoesFiltroAuditoria(): Promise<OpcoesFiltroAuditoria> {
  return http.get<OpcoesFiltroAuditoria>('/auditoria/filtros').then((r) => r.data)
}
