import { describe, expect, it } from 'vitest'
import { corEspecie } from './coresEspecie'

describe('corEspecie', () => {
  it('mapeia as 4 espécies do catálogo para uma cor', () => {
    expect(corEspecie('canino')).toBe('#558B2F')
    expect(corEspecie('felino')).toBe('#00695C')
    expect(corEspecie('pnh')).toBe('#8D6E63')
    expect(corEspecie('quiroptero')).toBe('#5E35B1')
  })

  it('devolve uma cor de fallback para código desconhecido, sem lançar', () => {
    expect(() => corEspecie('especie_inexistente')).not.toThrow()
    expect(corEspecie('especie_inexistente')).toBe('#9AAABB')
  })
})
