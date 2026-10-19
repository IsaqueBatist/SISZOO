import type { IconName } from '@/components/layout/Icon'
import type { DashboardKpis } from '../types/dashboard.types'

export interface KpiCardData {
  tone: 'kpi-info' | 'kpi-success' | 'kpi-alert' | 'kpi-danger'
  icon: IconName
  label: string
  value: string
  unit?: string
  foot: string
  delta?: string
  deltaDirection?: 'up' | 'down'
  mockado: boolean
}

function formatarDelta(valor: number | undefined, formatar: (v: number) => string): KpiCardData['delta'] {
  if (valor === undefined) return undefined
  const seta = valor >= 0 ? '▲' : '▼'
  return `${seta} ${formatar(Math.abs(valor))}`
}

function direcao(valor: number | undefined): KpiCardData['deltaDirection'] {
  if (valor === undefined) return undefined
  return valor >= 0 ? 'up' : 'down'
}

// `vacinacaoEAdocoesMockadas` vem de dashboardApi.ts::vacinacaoEAdocoesUsamMock()
// — Total de Animais e Ocorrências já são sempre reais, só Vacinados e
// Adoções podem estar mockados hoje.
export function mapearKpisParaCards(kpis: DashboardKpis, vacinacaoEAdocoesMockadas: boolean): KpiCardData[] {
  return [
    {
      tone: 'kpi-info',
      icon: 'paw',
      label: 'Total de Animais',
      value: String(kpis.animais.total),
      foot: `${kpis.animais.caninos} cães · ${kpis.animais.felinos} gatos`,
      delta: formatarDelta(kpis.animais.variacaoSemanal, (v) => `+${v} essa semana`),
      deltaDirection: direcao(kpis.animais.variacaoSemanal),
      mockado: false,
    },
    {
      tone: 'kpi-success',
      icon: 'syringe',
      label: 'Vacinados',
      value: String(kpis.vacinacao.percentualVacinados),
      unit: '%',
      foot: `${kpis.vacinacao.vacinados} de ${kpis.vacinacao.total} animais`,
      delta: formatarDelta(kpis.vacinacao.variacaoSemanalPontos, (v) => `${v}% vs semana`),
      deltaDirection: direcao(kpis.vacinacao.variacaoSemanalPontos),
      mockado: vacinacaoEAdocoesMockadas,
    },
    {
      tone: 'kpi-alert',
      icon: 'heart',
      label: 'Adoções no Mês',
      value: String(kpis.adocoes.noMes),
      foot: `Meta mensal: ${kpis.adocoes.metaMensal}`,
      delta: formatarDelta(kpis.adocoes.variacaoSemanal, (v) => `+${v} essa semana`),
      deltaDirection: direcao(kpis.adocoes.variacaoSemanal),
      mockado: vacinacaoEAdocoesMockadas,
    },
    {
      tone: 'kpi-danger',
      icon: 'alert',
      label: 'Ocorrências registradas hoje',
      value: String(kpis.ocorrencias.registradasHoje),
      foot:
        kpis.ocorrencias.mediaPorHora !== undefined
          ? `Registradas hoje · média ${kpis.ocorrencias.mediaPorHora} a cada hora`
          : 'Registradas hoje',
      delta: formatarDelta(kpis.ocorrencias.variacaoSemanal, (v) => `${v} vs semana passada`),
      deltaDirection: direcao(kpis.ocorrencias.variacaoSemanal),
      mockado: false,
    },
  ]
}
