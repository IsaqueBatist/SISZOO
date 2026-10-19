import { describe, expect, it } from 'vitest'
import { corDoenca } from './coresDoenca'

describe('corDoenca', () => {
  it('mapeia cada código conhecido do catálogo para uma cor', () => {
    expect(corDoenca('raiva')).toBe('#C62828')
    expect(corDoenca('esporotricose')).toBe('#6A1B9A')
    expect(corDoenca('leishmaniose_visceral')).toBe('#F57F17')
    expect(corDoenca('leptospirose')).toBe('#1565C0')
    expect(corDoenca('febre_maculosa')).toBe('#E65100')
    expect(corDoenca('febre_amarela')).toBe('#F9A825')
  })

  it('devolve uma cor de fallback para código desconhecido, sem lançar', () => {
    expect(() => corDoenca('doenca_inexistente')).not.toThrow()
    expect(corDoenca('doenca_inexistente')).toBe('#9AAABB')
  })
})
