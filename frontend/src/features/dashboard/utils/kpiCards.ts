import type { DashboardKpis } from '../types/dashboard.types'

export interface KpiCardData {
  label: string
  value: string
  unit?: string
  foot: string
  para?: string
  modulo?: string
  rotuloLink?: string
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
      label: 'Animais sob custódia',
      value: String(kpis.animais.total),
      foot: rodapeDeEspecies(kpis),
      para: '/animais?status=sob_custodia',
      modulo: 'animais',
      rotuloLink: 'Ver animais sob custódia',
    },
    {
      label: 'Vacinados',
      value: String(kpis.vacinacao.percentualVacinados),
      unit: '%',
      foot: `${kpis.vacinacao.vacinados} de ${kpis.vacinacao.total} animais`,
      para: '/alertas/vacinas',
      modulo: 'animais',
      rotuloLink: 'Ver reforços pendentes',
    },
    {
      label: 'Ocorrências hoje',
      value: String(kpis.ocorrencias.registradasHoje),
      foot:
        kpis.ocorrencias.mediaPorHora != null
          ? `Registradas desde 0h · média de ${kpis.ocorrencias.mediaPorHora.toLocaleString('pt-BR')} por hora`
          : 'Registradas desde 0h',
      para: '/ocorrencias?de={hoje}&ate={hoje}',
      modulo: 'ocorrencias',
      rotuloLink: 'Ver ocorrências de hoje',
    },
    {
      label: 'Animais adotados',
      value: String(kpis.adocoes.adotados),
      foot: `${kpis.adocoes.disponiveis} ${kpis.adocoes.disponiveis === 1 ? 'disponível' : 'disponíveis'} para adoção`,
      para: '/animais?status=adotado',
      modulo: 'animais',
      rotuloLink: 'Ver animais adotados',
    },
  ]
  return usaMock ? cards.map((card) => ({ ...card, isMock: true })) : cards
}
