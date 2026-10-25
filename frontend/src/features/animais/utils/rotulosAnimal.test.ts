import { describe, expect, it } from 'vitest'
import { formatarPorte, formatarSexo } from './rotulosAnimal'

describe('rotulosAnimal', () => {
  it('sexo', () => {
    expect(formatarSexo('macho')).toBe('Macho')
    expect(formatarSexo('femea')).toBe('Fêmea')
    expect(formatarSexo('nao_identificado')).toBe('Não identificado')
  })

  it('porte', () => {
    expect(formatarPorte('pequeno')).toBe('Pequeno')
    expect(formatarPorte('medio')).toBe('Médio')
    expect(formatarPorte('grande')).toBe('Grande')
    expect(formatarPorte(null)).toBe('—')
  })
})
