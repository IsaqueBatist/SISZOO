import { afterEach, describe, expect, it, vi } from 'vitest'
import { formatarDataBR, hojeEmItu } from './datas'

describe('formatarDataBR', () => {
  it('formata LocalDate sem deslocar para o dia anterior', () => {
    expect(formatarDataBR('2026-10-11')).toBe('11/10/2026')
  })

  it('formata LocalDateTime pelo dia, ignorando a hora', () => {
    expect(formatarDataBR('2026-10-11T23:59:59.97')).toBe('11/10/2026')
    expect(formatarDataBR('2026-01-01T00:00:00')).toBe('01/01/2026')
  })

  it('devolve "—" para nulo, indefinido ou vazio', () => {
    expect(formatarDataBR(null)).toBe('—')
    expect(formatarDataBR(undefined)).toBe('—')
    expect(formatarDataBR('')).toBe('—')
  })
})

describe('hojeEmItu', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('usa o dia de São Paulo quando em UTC já é o dia seguinte', () => {
    // 2026-10-19 01:30 UTC = 2026-10-18 22:30 em São Paulo (UTC-3).
    vi.useFakeTimers({ now: new Date('2026-10-19T01:30:00Z') })
    expect(hojeEmItu()).toBe('2026-10-18')
  })

  it('vira o dia à meia-noite de São Paulo', () => {
    vi.useFakeTimers({ now: new Date('2026-10-19T03:00:00Z') })
    expect(hojeEmItu()).toBe('2026-10-19')
  })
})
