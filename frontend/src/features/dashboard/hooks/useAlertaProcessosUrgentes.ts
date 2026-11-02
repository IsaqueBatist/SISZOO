import { useQuery } from '@tanstack/react-query'
import { listarProcessos } from '@/features/processos/api/processosApi'
import type { ProcessoResumo } from '@/features/processos/types/processos.types'

const TAMANHO_PAGINA_URGENTES = 10

export interface ProcessosUrgentes {
  itens: ProcessoResumo[]
  totalUrgentes: number
}

export function useProcessosUrgentesQuery() {
  return useQuery({
    queryKey: ['dashboard', 'processos-urgentes'],
    queryFn: () => listarProcessos({ urgente: true, pagina: 0, tamanho: TAMANHO_PAGINA_URGENTES }),
    select: (pagina): ProcessosUrgentes => ({ itens: pagina.itens, totalUrgentes: pagina.totalItens }),
  })
}
