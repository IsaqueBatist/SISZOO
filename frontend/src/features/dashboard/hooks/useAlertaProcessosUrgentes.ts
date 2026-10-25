import { useQuery } from '@tanstack/react-query'
import { listarProcessos } from '@/features/processos/api/processosApi'
import type { ProcessoResumo } from '@/features/processos/types/processos.types'

// T45: o backend filtra ?urgente=true (docs/contratos/
// processos-filtro-urgente.md) e o total vem de `totalItens` — exato mesmo
// com mais urgentes do que cabem na página (antes, uma página de 50 sem filtro
// era filtrada aqui e acima de 50 urgentes o card perdia itens sem aviso). O
// card só mostra os primeiros, então uma página pequena basta.
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
