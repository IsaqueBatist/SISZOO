import { describe, expect, it } from 'vitest'
import { normalizarBusca } from './texto'

describe('normalizarBusca', () => {
  it('ignora acento, cedilha, maiúscula e espaços nas pontas', () => {
    expect(normalizarBusca('  São João  ')).toBe('sao joao')
    expect(normalizarBusca('AÇÃO')).toBe('acao')
  })
})
