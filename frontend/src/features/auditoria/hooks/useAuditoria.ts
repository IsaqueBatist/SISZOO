import { useQuery } from '@tanstack/react-query'
import { listarEventosAuditoria } from '../api/auditoriaApi'

export function useEventosAuditoriaQuery(pagina: number, tamanho: number) {
  return useQuery({
    queryKey: ['auditoria', pagina, tamanho],
    queryFn: () => listarEventosAuditoria(pagina, tamanho),
    placeholderData: (dadosAnteriores) => dadosAnteriores,
  })
}
