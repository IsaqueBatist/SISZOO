import { afterEach, describe, expect, it, vi } from 'vitest'
import type { AlertaVacinalAnimal } from '@/features/alertas/types/alertas.types'
import { hojeEmItu } from '@/lib/datas'
import { adicionarDiasIso } from '@/test/datas'
import { API_BASE_URL } from '@/lib/env'
import { resetVacinacoesMock } from './handlers'

// As datas do mock (aplicação, validade) são datas civis relativas a "hoje" e
// o handler de alertas compara com hojeEmItu, como o backend. Se o mock
// partisse do dia UTC, entre 21:00 e 23:59 em Itu a vacina "a vencer em 5
// dias" sairia com 6 dias restantes. Mesmos instantes de hojeNoFusoDeItu.test.ts.
const VIRADAS = [
  ['20:59 BRT', '2030-03-15T23:59:00Z'],
  ['21:00 BRT', '2030-03-16T00:00:00Z'],
  ['23:59 BRT', '2030-03-16T02:59:00Z'],
  ['00:00 BRT', '2030-03-16T03:00:00Z'],
  ['30/04 21:30 BRT', '2030-05-01T00:30:00Z'],
  ['31/12 21:30 BRT', '2031-01-01T00:30:00Z'],
] as const

const VACINA_VENCIDA_HA_10_DIAS = 'd1000000-0000-0000-0000-000000000001'
const VACINA_A_VENCER_EM_5_DIAS = 'd1000000-0000-0000-0000-000000000002'

afterEach(() => {
  vi.useRealTimers()
})

describe.each(VIRADAS)('mock de vacinas em %s', (_caso, instante) => {
  it('vencida há 10 dias e a vencer em 5 dias, contados no dia de Itu', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(instante))
    resetVacinacoesMock()

    const animais = (await (await fetch(`${API_BASE_URL}/alertas/vacinas`)).json()) as AlertaVacinalAnimal[]
    const itens = animais.flatMap((animal) => animal.vacinas)
    const vencida = itens.find((item) => item.vacinacaoId === VACINA_VENCIDA_HA_10_DIAS)
    const aVencer = itens.find((item) => item.vacinacaoId === VACINA_A_VENCER_EM_5_DIAS)

    expect(vencida?.dataValidade).toBe(adicionarDiasIso(hojeEmItu(), -10))
    expect(vencida?.diasRestantes).toBe(-10)
    expect(aVencer?.dataValidade).toBe(adicionarDiasIso(hojeEmItu(), 5))
    expect(aVencer?.diasRestantes).toBe(5)
  })
})
