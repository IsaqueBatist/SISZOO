import { describe, expect, it } from 'vitest'
import { calcularPercentual, estadoLotacao } from './estadoLotacao'

describe('calcularPercentual', () => {
  it('arredonda a proporção ocupação/capacidade', () => {
    expect(calcularPercentual(4, 6)).toBe(67)
    expect(calcularPercentual(7, 8)).toBe(88)
  })

  it('não gera Infinity/NaN quando capacidade é zero', () => {
    expect(calcularPercentual(0, 0)).toBe(0)
    expect(calcularPercentual(3, 0)).toBe(100)
  })
})

describe('estadoLotacao', () => {
  it('classifica como disponível abaixo de 80%', () => {
    expect(estadoLotacao(3, 6)).toBe('disponivel')
    expect(estadoLotacao(0, 6)).toBe('disponivel')
  })

  it('classifica os limites exatos 79% e 80%', () => {
    expect(estadoLotacao(79, 100)).toBe('disponivel')
    expect(estadoLotacao(80, 100)).toBe('atencao')
  })

  it('classifica os limites exatos 99% e 100%', () => {
    expect(estadoLotacao(99, 100)).toBe('atencao')
    expect(estadoLotacao(100, 100)).toBe('superlotada')
  })

  it('classifica acima de 100% como superlotada', () => {
    expect(estadoLotacao(8, 6)).toBe('superlotada')
  })

  it('trata capacidade zero sem gerar estado inválido', () => {
    expect(estadoLotacao(0, 0)).toBe('disponivel')
    expect(estadoLotacao(2, 0)).toBe('superlotada')
  })
})
