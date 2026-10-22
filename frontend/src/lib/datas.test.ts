import { afterEach, describe, expect, it, vi } from 'vitest'
import { adicionarDiasIso, diasCivisAteHoje, formatarDataBR, formatarDataHoraBR, hojeEmItu } from './datas'

describe('formatarDataHoraBR', () => {
  it('formata LocalDateTime pelo horário de parede, sem converter fuso', () => {
    expect(formatarDataHoraBR('2026-05-20T00:30:00')).toBe('20/05/2026, 00:30')
    expect(formatarDataHoraBR('2026-12-31T23:59:59.97')).toBe('31/12/2026, 23:59')
  })

  it('devolve "—" para nulo, vazio ou data sem hora', () => {
    expect(formatarDataHoraBR(null)).toBe('—')
    expect(formatarDataHoraBR('')).toBe('—')
    expect(formatarDataHoraBR('2026-05-20')).toBe('—')
  })
})

describe('adicionarDiasIso', () => {
  it('soma e subtrai dias civis atravessando mês, ano e 29/02', () => {
    expect(adicionarDiasIso('2030-04-30', 1)).toBe('2030-05-01')
    expect(adicionarDiasIso('2030-12-31', 1)).toBe('2031-01-01')
    expect(adicionarDiasIso('2028-03-01', -1)).toBe('2028-02-29')
    expect(adicionarDiasIso('2030-03-15T23:59:00', 0)).toBe('2030-03-15')
  })
})

describe('diasCivisAteHoje', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it.each([
    ['31/12 21:30 em Itu (01/01 em UTC), registro de hoje 00:10', '2031-01-01T00:30:00Z', '2030-12-31T00:10:00', 0],
    ['31/12 21:30 em Itu, registro de ontem 23:59', '2031-01-01T00:30:00Z', '2030-12-30T23:59:00', 1],
    ['01/05 00:00 em Itu, registro de 30/04 23:59', '2030-05-01T03:00:00Z', '2030-04-30T23:59:00', 1],
    ['16/03 09:30 em Itu, registro de ontem 10:00 (menos de 24 h)', '2030-03-16T12:30:00Z', '2030-03-15T10:00:00', 1],
    ['15/03 20:59 em Itu, registro de 10 dias atrás (só data)', '2030-03-15T23:59:00Z', '2030-03-05', 10],
  ])('%s', (_caso, agora, iso, esperado) => {
    vi.useFakeTimers({ now: new Date(agora) })
    expect(diasCivisAteHoje(iso)).toBe(esperado)
  })
})

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
