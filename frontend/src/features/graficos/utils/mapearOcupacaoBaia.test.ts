import { describe, expect, it } from 'vitest'
import type { Baia } from '@/features/animais/types/animais.types'
import { mapearOcupacaoBaia } from './mapearOcupacaoBaia'

function baia(sobrescrever: Partial<Baia>): Baia {
  return {
    id: 'id-padrao',
    nome: 'Baia',
    tipoBaiaCodigo: 'canil',
    tipoBaiaNome: 'Canil',
    capacidade: 2,
    finalidade: null,
    ativa: true,
    observacoes: null,
    ocupacaoAtual: 0,
    superlotada: false,
    ...sobrescrever,
  }
}

describe('mapearOcupacaoBaia', () => {
  it('ordena por percentual de ocupação decrescente', () => {
    const resultado = mapearOcupacaoBaia([
      baia({ id: '1', nome: 'Baia 1', ocupacaoAtual: 1, capacidade: 4 }), // 25%
      baia({ id: '2', nome: 'Baia 2', ocupacaoAtual: 2, capacidade: 2 }), // 100%
      baia({ id: '3', nome: 'Baia 3', ocupacaoAtual: 2, capacidade: 4 }), // 50%
    ])

    expect(resultado.map((item) => item.nome)).toEqual(['Baia 2', 'Baia 3', 'Baia 1'])
  })

  it('exclui baias inativas', () => {
    const resultado = mapearOcupacaoBaia([
      baia({ id: '1', nome: 'Ativa', ativa: true }),
      baia({ id: '2', nome: 'Inativa', ativa: false }),
    ])

    expect(resultado).toHaveLength(1)
    expect(resultado[0].nome).toBe('Ativa')
  })

  it('baia com ocupação acima da capacidade (overflow) é classificada superlotada', () => {
    const resultado = mapearOcupacaoBaia([baia({ id: '1', ocupacaoAtual: 5, capacidade: 2 })])

    expect(resultado[0].estado).toBe('superlotada')
    expect(resultado[0].percentual).toBe(250)
  })
})
