import { describe, expect, it } from 'vitest'
import type { DashboardKpis } from '../types/dashboard.types'
import { mapearKpisParaCards } from './kpiCards'

function kpisBase(sobrescrever: Partial<DashboardKpis> = {}): DashboardKpis {
  return {
    animais: { total: 147, caninos: 123, felinos: 24, variacaoSemanal: 12 },
    vacinacao: { percentualVacinados: 84, vacinados: 123, total: 147, variacaoSemanalPontos: 5.2 },
    adocoes: { noMes: 8, metaMensal: 12, variacaoSemanal: 2 },
    ocorrencias: { abertasHoje: 4, mediaPorHora: 1, variacaoSemanal: -2 },
    ...sobrescrever,
  }
}

describe('mapearKpisParaCards', () => {
  it('mapeia os 4 KPIs com valores, unidade e rodapé corretos', () => {
    const cards = mapearKpisParaCards(kpisBase())

    expect(cards).toHaveLength(4)
    expect(cards[0]).toMatchObject({ label: 'Total de Animais', value: '147', foot: '123 cães · 24 gatos' })
    expect(cards[1]).toMatchObject({ label: 'Vacinados', value: '84', unit: '%', foot: '123 de 147 animais' })
    expect(cards[2]).toMatchObject({ label: 'Adoções no Mês', value: '8', foot: 'Meta mensal: 12' })
    expect(cards[3]).toMatchObject({ label: 'Ocorrências', value: '4' })
  })

  it('direção do delta reflete o sinal do valor de variação', () => {
    const cards = mapearKpisParaCards(kpisBase())
    const ocorrencias = cards.find((card) => card.label === 'Ocorrências')

    expect(ocorrencias?.deltaDirection).toBe('down')
    expect(ocorrencias?.delta).toContain('▼')

    const animais = cards.find((card) => card.label === 'Total de Animais')
    expect(animais?.deltaDirection).toBe('up')
    expect(animais?.delta).toContain('▲')
  })

  it('esconde o delta quando o campo de variação está ausente', () => {
    const cards = mapearKpisParaCards(kpisBase({ animais: { total: 147, caninos: 123, felinos: 24 } }))
    const animais = cards.find((card) => card.label === 'Total de Animais')

    expect(animais?.delta).toBeUndefined()
    expect(animais?.deltaDirection).toBeUndefined()
  })

  it('mostra "Abertas hoje" sem a média quando mediaPorHora está ausente', () => {
    const cards = mapearKpisParaCards(kpisBase({ ocorrencias: { abertasHoje: 4 } }))
    const ocorrencias = cards.find((card) => card.label === 'Ocorrências')

    expect(ocorrencias?.foot).toBe('Abertas hoje')
  })
})
