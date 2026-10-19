import { useQuery } from '@tanstack/react-query'
import { listarProcessos } from '@/features/processos/api/processosApi'
import type { ProcessoResumo } from '@/features/processos/types/processos.types'

// O backend ordena urgente desc, dataAbertura desc e NÃO tem filtro
// ?urgente=true na URL (pedido registrado em docs/contratos/
// processos-filtro-urgente.md). Como "urgente" vem sempre antes de "não
// urgente" na ordenação, uma única página de 50 captura os urgentes mais
// recentes sem round-trip extra — mas se o CCZ tiver mais de 50 processos
// urgentes simultâneos, o card perde itens silenciosamente (risco
// documentado no plano, mitigação de longo prazo é o filtro de servidor).
const TAMANHO_PAGINA_URGENTES = 50

export interface ProcessosUrgentes {
  itens: ProcessoResumo[]
  totalUrgentes: number
}

export function useProcessosUrgentesQuery() {
  return useQuery({
    queryKey: ['dashboard', 'processos-urgentes'],
    queryFn: () => listarProcessos({ pagina: 0, tamanho: TAMANHO_PAGINA_URGENTES }),
    select: (pagina): ProcessosUrgentes => {
      const itens = pagina.itens.filter((item) => item.urgente)
      return { itens, totalUrgentes: itens.length }
    },
  })
}
