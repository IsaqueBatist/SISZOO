import { useAuth } from '@/features/auth/hooks/useAuth'
import { useKpisDashboardQuery } from '@/features/dashboard/hooks/useDashboardKpis'
import { useProcessosUrgentesQuery } from '@/features/dashboard/hooks/useAlertaProcessosUrgentes'
import { TOM_POR_SEVERIDADE_ALERTA } from '@/features/dashboard/utils/tonsDeAlerta'
import type { AlertaCritico } from '@/features/dashboard/types/dashboard.types'
import type { ProcessoResumo } from '@/features/processos/types/processos.types'
import { podeAcessar } from '@/lib/nav'

const PROCESSOS_URGENTES_NO_RESUMO = 5

export interface NotificacaoResumo {
  id: string
  titulo: string
  descricao: string
  tom: 'danger' | 'warning' | 'alert-yellow' | 'info'
  urgente: boolean
  para?: string
}

function ehAlertaDeVacina(alerta: AlertaCritico): boolean {
  return alerta.tipo === 'vacina_vencendo' || alerta.tipo === 'vacina_vencida'
}

function paraNotificacao(alerta: AlertaCritico): NotificacaoResumo {
  const ehVacina = ehAlertaDeVacina(alerta)
  return {
    id: alerta.tipo,
    titulo: alerta.titulo,
    descricao: alerta.descricao,
    tom: TOM_POR_SEVERIDADE_ALERTA[alerta.severidade] ?? 'info',
    urgente: alerta.severidade === 'critico',
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
  total: number
  carregando: boolean
}

export function useResumoNotificacoes(): ResumoNotificacoes {
  const { roleKey } = useAuth()
  const kpis = useKpisDashboardQuery()
  const urgentes = useProcessosUrgentesQuery()

  const acessaAnimais = podeAcessar(roleKey, 'animais')
  const alertas = (kpis.data?.alertas ?? [])
    .filter((alerta) => alerta.total > 0)
    .filter((alerta) => acessaAnimais || !ehAlertaDeVacina(alerta))
    .map(paraNotificacao)
  const processos = urgentesParaNotificacao(urgentes.data?.itens ?? [], urgentes.data?.totalUrgentes ?? 0)

  const itens = [...processos, ...alertas.filter((item) => item.urgente), ...alertas.filter((item) => !item.urgente)]

  return { itens, total: itens.length, carregando: kpis.isLoading || urgentes.isLoading }
}
