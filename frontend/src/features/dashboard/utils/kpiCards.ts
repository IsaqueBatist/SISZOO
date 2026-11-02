import type { IconName } from '@/components/layout/Icon'
import type { DashboardKpis } from '../types/dashboard.types'

export interface KpiCardData {
  tone: 'kpi-info' | 'kpi-success' | 'kpi-alert' | 'kpi-danger'
  icon: IconName
  label: string
  value: string
  unit?: string
  foot: string
  isMock?: boolean
}

function rodapeDeEspecies({ animais }: DashboardKpis): string {
  const outros = animais.total - animais.caninos - animais.felinos
  const partes = [`${animais.caninos} cães`, `${animais.felinos} gatos`]
  if (outros > 0) partes.push(`${outros} ${outros === 1 ? 'outro' : 'outros'}`)
  return partes.join(' · ')
}

export function mapearKpisParaCards(kpis: DashboardKpis, usaMock = false): KpiCardData[] {
  const cards: KpiCardData[] = [
    {
      tone: 'kpi-info',
      icon: 'paw',
      label: 'Animais sob custódia',
      value: String(kpis.animais.total),
      foot: rodapeDeEspecies(kpis),
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
