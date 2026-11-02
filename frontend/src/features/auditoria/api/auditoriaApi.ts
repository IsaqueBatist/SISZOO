import { http } from '@/lib/http'
import type { PaginaResponse } from '@/features/usuarios/types/usuarios.types'
import type { EventoAuditoria, FiltrosAuditoria, OpcoesFiltroAuditoria } from '../types/auditoria.types'

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

export function buscarOpcoesFiltroAuditoria(): Promise<OpcoesFiltroAuditoria> {
  return http.get<OpcoesFiltroAuditoria>('/auditoria/filtros').then((r) => r.data)
}
