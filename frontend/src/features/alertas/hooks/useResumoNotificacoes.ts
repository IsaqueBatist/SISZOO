import { useKpisDashboardQuery } from '@/features/dashboard/hooks/useDashboardKpis'
import { useProcessosUrgentesQuery } from '@/features/dashboard/hooks/useAlertaProcessosUrgentes'
import { TOM_POR_SEVERIDADE_ALERTA } from '@/features/dashboard/utils/tonsDeAlerta'
import type { AlertaCritico } from '@/features/dashboard/types/dashboard.types'
import type { ProcessoResumo } from '@/features/processos/types/processos.types'

const PROCESSOS_URGENTES_NO_RESUMO = 5

export interface NotificacaoResumo {
  id: string
  titulo: string
  descricao: string
  tom: 'danger' | 'warning' | 'alert-yellow' | 'info'
  urgente: boolean
  para?: string
}

function paraNotificacao(alerta: AlertaCritico): NotificacaoResumo {
  const ehVacina = alerta.tipo === 'vacina_vencendo' || alerta.tipo === 'vacina_vencida'
  return {
    id: alerta.tipo,
    titulo: alerta.titulo,
    descricao: alerta.descricao,
    tom: TOM_POR_SEVERIDADE_ALERTA[alerta.severidade] ?? 'info',
    urgente: alerta.severidade === 'critico',
    // Só os tipos com tela de detalhe viram link: levar para uma tela que não
    // existe é pior do que não navegar (mesma regra do dashboard).
    para: ehVacina ? '/alertas/vacinas' : undefined,
  }
}

function urgentesParaNotificacao(itens: ProcessoResumo[], total: number): NotificacaoResumo[] {
  if (total === 0) return []
  const nomeados = itens.slice(0, PROCESSOS_URGENTES_NO_RESUMO)
  return [
    {
      id: 'processos_urgentes',
      titulo: `${total} processo${total === 1 ? '' : 's'} urgente${total === 1 ? '' : 's'}`,
      descricao: nomeados.map((processo) => `${processo.protocolo} (${processo.doenca.nome})`).join('; '),
      tom: 'danger',
      urgente: true,
      para: '/processos',
    },
  ]
}

export interface ResumoNotificacoes {
  itens: NotificacaoResumo[]
  // Quantidade de alertas ATIVOS, não a soma dos itens: somar daria um número
  // de três dígitos que assusta sem informar o que precisa de ação.
  total: number
  carregando: boolean
}

// Resumo para o sino da topbar. **Reusa os hooks do dashboard** em vez de
// declarar as próprias consultas: as chaves ['dashboard','kpis'] e
// ['dashboard','processos-urgentes'] já são deles, e dois observadores na
// mesma chave com `queryFn` diferente fariam o cache depender de quem montasse
// primeiro — o sino e o dashboard passariam a discordar em silêncio. Como as
// chaves são as mesmas, o sino também não acrescenta requisição alguma.
//
// Limite conhecido: GET /dashboard/kpis é @Cacheable por 5 min no servidor e
// não tem @CacheEvict (docs/contratos/dashboard-kpis.md), então os alertas
// agregados podem demorar esse tempo para refletir uma escrita. Já valia para
// o dashboard; o sino herda.
export function useResumoNotificacoes(): ResumoNotificacoes {
  const kpis = useKpisDashboardQuery()
  const urgentes = useProcessosUrgentesQuery()

  const alertas = (kpis.data?.alertas ?? []).filter((alerta) => alerta.total > 0).map(paraNotificacao)
  const processos = urgentesParaNotificacao(urgentes.data?.itens ?? [], urgentes.data?.totalUrgentes ?? 0)

  // Urgentes primeiro, como na listagem de processos.
  const itens = [...processos, ...alertas.filter((item) => item.urgente), ...alertas.filter((item) => !item.urgente)]

  return { itens, total: itens.length, carregando: kpis.isLoading || urgentes.isLoading }
}
