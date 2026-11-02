import { describe, expect, it } from 'vitest'
import { formatarTempoDesdeEntrada } from './tempoDesdeEntrada'

describe('formatarTempoDesdeEntrada', () => {
  it('conta dias inteiros desde a entrada', () => {
    expect(formatarTempoDesdeEntrada(73)).toBe('há 3 dias')
    expect(formatarTempoDesdeEntrada(96)).toBe('há 4 dias')
    expect(formatarTempoDesdeEntrada(30)).toBe('há 1 dia')
  })

  it('mostra horas quando ainda não completou um dia', () => {
    expect(formatarTempoDesdeEntrada(5)).toBe('há 5 h')
  })
})
