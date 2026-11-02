import { useQuery } from '@tanstack/react-query'
import { buscarOpcoesFiltroAuditoria, listarEventosAuditoria } from '../api/auditoriaApi'
import type { FiltrosAuditoria } from '../types/auditoria.types'

export function useEventosAuditoriaQuery(pagina: number, tamanho: number, filtros: FiltrosAuditoria = {}) {
  return useQuery({
    queryKey: ['auditoria', pagina, tamanho, filtros],
    queryFn: () => listarEventosAuditoria(pagina, tamanho, filtros),
    placeholderData: (dadosAnteriores) => dadosAnteriores,
  })
}

export function useOpcoesFiltroAuditoriaQuery() {
  return useQuery({
    queryKey: ['auditoria', 'filtros'],
    queryFn: buscarOpcoesFiltroAuditoria,
    staleTime: 60_000,
  })
}
