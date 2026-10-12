import { describe, expect, it } from 'vitest'
import { formatarData, formatarDataHora, formatarHora } from './datas'

describe('formatadores de data da API de ocorrências', () => {
  it('formata LocalDate sem deslocar o dia (sem new Date em UTC)', () => {
    expect(formatarData('2026-10-11')).toBe('11/10/2026')
    expect(formatarData('2026-01-01')).toBe('01/01/2026')
  })

  it('formata a data de um LocalDateTime com fração de segundo de qualquer tamanho', () => {
    expect(formatarData('2026-10-11T23:59:59.9697862')).toBe('11/10/2026')
    expect(formatarDataHora('2026-10-11T19:28:59.9697862')).toBe('11/10/2026 · 19:28')
    expect(formatarDataHora('2026-10-11T00:05:00')).toBe('11/10/2026 · 00:05')
  })

  it('formata LocalTime com ou sem segundos', () => {
    expect(formatarHora('10:30:00')).toBe('10:30')
    expect(formatarHora('10:30')).toBe('10:30')
  })
})
