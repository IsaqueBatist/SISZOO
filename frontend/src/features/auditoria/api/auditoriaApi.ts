import { http } from '@/lib/http'
import type { PaginaResponse } from '@/features/usuarios/types/usuarios.types'
import type { EventoAuditoria } from '../types/auditoria.types'

// GET /api/auditoria (AuditoriaController, já existe e está em produção) —
// protegido por USUARIOS_ACESSO:leitura, exclusivo do Admin (confirmado em
// V3__seed_cargos.sql). Sem filtro de servidor por ação/entidade/usuário/
// data — só paginação (ver docs/contratos/auditoria-filtros.md).
export function listarEventosAuditoria(pagina: number, tamanho: number): Promise<PaginaResponse<EventoAuditoria>> {
  return http.get<PaginaResponse<EventoAuditoria>>('/auditoria', { params: { pagina, tamanho } }).then((r) => r.data)
}
