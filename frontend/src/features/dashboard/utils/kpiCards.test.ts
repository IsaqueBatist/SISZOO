import { describe, expect, it } from 'vitest'
import type { DashboardKpis } from '../types/dashboard.types'
import { mapearKpisParaCards } from './kpiCards'

function kpisBase(sobrescrever: Partial<DashboardKpis> = {}): DashboardKpis {
  return {
    animais: { total: 147, caninos: 123, felinos: 24 },
    vacinacao: { percentualVacinados: 84, vacinados: 123, total: 147 },
    adocoes: { adotados: 8, disponiveis: 12 },
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
    expect(cards[2]).toMatchObject({ label: 'Animais Adotados', value: '8', foot: '12 disponíveis para adoção' })
    expect(cards[3]).toMatchObject({ label: 'Ocorrências', value: '4' })
  })

  it('usa o singular quando há 1 animal disponível para adoção', () => {
    const cards = mapearKpisParaCards(kpisBase({ adocoes: { adotados: 0, disponiveis: 1 } }))

    expect(cards[2]).toMatchObject({ value: '0', foot: '1 disponível para adoção' })
  })

  it('com dados reais nenhum card é marcado como mock', () => {
    const cards = mapearKpisParaCards(kpisBase())

    expect(cards.some((card) => card.isMock)).toBe(false)
  })

  it('com o mock de desenvolvimento ligado todos os cards são marcados', () => {
    const cards = mapearKpisParaCards(kpisBase(), true)

    expect(cards.every((card) => card.isMock)).toBe(true)
  })

  it('mostra "Registradas hoje" sem a média quando mediaPorHora está ausente', () => {
    const cards = mapearKpisParaCards(kpisBase({ ocorrencias: { registradasHoje: 4 } }))
    const ocorrencias = cards.find((card) => card.label === 'Ocorrências')

    expect(ocorrencias?.foot).toBe('Registradas hoje')
  })

  it('mostra "Registradas hoje" sem a média quando a API devolve mediaPorHora null (virada do dia)', () => {
    const cards = mapearKpisParaCards(kpisBase({ ocorrencias: { registradasHoje: 0, mediaPorHora: null } }))
    const ocorrencias = cards.find((card) => card.label === 'Ocorrências')

    expect(ocorrencias?.foot).toBe('Registradas hoje')
  })

  it('mostra a média por hora quando presente', () => {
    const cards = mapearKpisParaCards(kpisBase({ ocorrencias: { registradasHoje: 4, mediaPorHora: 0.5 } }))
    const ocorrencias = cards.find((card) => card.label === 'Ocorrências')

    expect(ocorrencias?.foot).toBe('Registradas hoje · média 0.5 a cada hora')
  })
})
