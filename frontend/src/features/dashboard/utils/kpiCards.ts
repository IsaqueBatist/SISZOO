import type { IconName } from '@/components/layout/Icon'
import type { DashboardKpis } from '../types/dashboard.types'

export interface KpiCardData {
  tone: 'kpi-info' | 'kpi-success' | 'kpi-alert' | 'kpi-danger'
  icon: IconName
  label: string
  value: string
  unit?: string
  foot: string
  // Só o card de Adoções usa isto hoje: é o único bloco sem fonte real no
  // backend (ver dashboard.types.ts::KpiAdocoes). Mostra o selo "Dados de
  // demonstração" no card individual, no mesmo padrão já usado pelos cards
  // de gráfico (GraficosDashboard.tsx), em vez de um selo único pra seção
  // inteira — os outros 3 cards são reais.
  isMock?: boolean
}

export function mapearKpisParaCards(kpis: DashboardKpis): KpiCardData[] {
  return [
    {
      tone: 'kpi-info',
      icon: 'paw',
      label: 'Total de Animais',
      value: String(kpis.animais.total),
      foot: `${kpis.animais.caninos} cães · ${kpis.animais.felinos} gatos`,
    },
    {
      tone: 'kpi-success',
      icon: 'syringe',
      label: 'Vacinados',
      value: String(kpis.vacinacao.percentualVacinados),
      unit: '%',
      foot: `${kpis.vacinacao.vacinados} de ${kpis.vacinacao.total} animais`,
    },
    {
      tone: 'kpi-alert',
      icon: 'heart',
      label: 'Adoções no Mês',
      value: String(kpis.adocoes.noMes),
      foot: `Meta mensal: ${kpis.adocoes.metaMensal}`,
      isMock: true,
    },
    {
      tone: 'kpi-danger',
      icon: 'alert',
      label: 'Ocorrências',
      value: String(kpis.ocorrencias.registradasHoje),
      foot:
        kpis.ocorrencias.mediaPorHora !== undefined
          ? `Registradas hoje · média ${kpis.ocorrencias.mediaPorHora} a cada hora`
          : 'Registradas hoje',
    },
  ]
}
