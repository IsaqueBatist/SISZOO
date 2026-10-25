import type { IconName } from '@/components/layout/Icon'
import type { DashboardKpis } from '../types/dashboard.types'

export interface KpiCardData {
  tone: 'kpi-info' | 'kpi-success' | 'kpi-alert' | 'kpi-danger'
  icon: IconName
  label: string
  value: string
  unit?: string
  foot: string
  // Só com VITE_USE_MOCK_KPIS=true (opt-in de desenvolvimento): mostra o selo
  // "Dados de demonstração" em cada card, no mesmo padrão dos cards de
  // gráfico (GraficosDashboard.tsx). Com dados reais, nunca aparece.
  isMock?: boolean
}

export function mapearKpisParaCards(kpis: DashboardKpis, usaMock = false): KpiCardData[] {
  const cards: KpiCardData[] = [
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
      label: 'Animais Adotados',
      value: String(kpis.adocoes.adotados),
      foot: `${kpis.adocoes.disponiveis} ${kpis.adocoes.disponiveis === 1 ? 'disponível' : 'disponíveis'} para adoção`,
    },
    {
      tone: 'kpi-danger',
      icon: 'alert',
      label: 'Ocorrências',
      value: String(kpis.ocorrencias.registradasHoje),
      foot:
        kpis.ocorrencias.mediaPorHora != null
          ? `Registradas hoje · média ${kpis.ocorrencias.mediaPorHora} a cada hora`
          : 'Registradas hoje',
    },
  ]
  return usaMock ? cards.map((card) => ({ ...card, isMock: true })) : cards
}
