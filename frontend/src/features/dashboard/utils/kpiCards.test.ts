import { describe, expect, it } from 'vitest'
import type { DashboardKpis } from '../types/dashboard.types'
import { mapearKpisParaCards } from './kpiCards'

function kpisBase(sobrescrever: Partial<DashboardKpis> = {}): DashboardKpis {
  return {
    animais: { total: 147, caninos: 123, felinos: 24 },
    vacinacao: { percentualVacinados: 84, vacinados: 123, total: 147 },
    adocoes: { noMes: 8, metaMensal: 12 },
    ocorrencias: { registradasHoje: 4, mediaPorHora: 1 },
    alertas: [],
    ...sobrescrever,
  }
}

describe('mapearKpisParaCards', () => {
  it('mapeia os 4 KPIs com valores, unidade e rodapé corretos', () => {
    const cards = mapearKpisParaCards(kpisBase())

    expect(cards).toHaveLength(4)
    expect(cards[0]).toMatchObject({ label: 'Total de Animais', value: '147', foot: '123 cães · 24 gatos' })
    expect(cards[1]).toMatchObject({ label: 'Vacinados', value: '84', unit: '%', foot: '123 de 147 animais' })
    expect(cards[2]).toMatchObject({ label: 'Adoções no Mês', value: '8', foot: 'Meta mensal: 12', isMock: true })
    expect(cards[3]).toMatchObject({ label: 'Ocorrências', value: '4' })
  })

  it('só o card de Adoções é marcado como mock', () => {
    const cards = mapearKpisParaCards(kpisBase())

    expect(cards.filter((card) => card.isMock)).toHaveLength(1)
    expect(cards.find((card) => card.isMock)?.label).toBe('Adoções no Mês')
  })

  it('mostra "Registradas hoje" sem a média quando mediaPorHora está ausente', () => {
    const cards = mapearKpisParaCards(kpisBase({ ocorrencias: { registradasHoje: 4 } }))
    const ocorrencias = cards.find((card) => card.label === 'Ocorrências')

    expect(ocorrencias?.foot).toBe('Registradas hoje')
  })

  it('mostra a média por hora quando presente', () => {
    const cards = mapearKpisParaCards(kpisBase({ ocorrencias: { registradasHoje: 4, mediaPorHora: 0.5 } }))
    const ocorrencias = cards.find((card) => card.label === 'Ocorrências')

    expect(ocorrencias?.foot).toBe('Registradas hoje · média 0.5 a cada hora')
  })
})
