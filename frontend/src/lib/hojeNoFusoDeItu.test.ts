import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { hojeIso as hojeIsoOcorrencias } from '@/features/ocorrencias/utils/datas'
import { hojeIso as hojeIsoProcessos } from '@/features/processos/schemas/processoFormSchema'
import { procedimentoFormSchema, vacinacaoFormSchema } from '@/features/animais/schemas/historicoFormSchemas'
import { hojeEmItu } from './datas'

// "Hoje" do formulário na virada do dia UTC x Itu (DER §5 regra 4; AC-1):
// entre 21:00 e 23:59 em Itu o dia UTC já é o seguinte. Só o Date é
// congelado, num instante de 2030/2031 que nunca coincide com o dia real,
// então o resultado não depende da hora nem do fuso da máquina que roda a
// suíte. Mesmos instantes de RegrasDeDataNaViradaDoDiaTest (backend).

// caso, instante UTC, dia de Itu, dia seguinte em Itu
const VIRADAS = [
  ['20:59 BRT (23:59 UTC, mesmo dia)', '2030-03-15T23:59:00Z', '2030-03-15', '2030-03-16'],
  ['21:00 BRT (00:00 UTC do dia seguinte)', '2030-03-16T00:00:00Z', '2030-03-15', '2030-03-16'],
  ['23:59 BRT', '2030-03-16T02:59:00Z', '2030-03-15', '2030-03-16'],
  ['00:00 BRT', '2030-03-16T03:00:00Z', '2030-03-16', '2030-03-17'],
  ['30/04 21:30 BRT (virada de mês em UTC)', '2030-05-01T00:30:00Z', '2030-04-30', '2030-05-01'],
  ['31/12 21:30 BRT (virada de ano em UTC)', '2031-01-01T00:30:00Z', '2030-12-31', '2031-01-01'],
] as const

// As três funções de "hoje" que existem no front (cópias da mesma regra).
const FUNCOES_DE_HOJE = [
  ['lib/datas#hojeEmItu', hojeEmItu],
  ['ocorrencias/utils/datas#hojeIso', hojeIsoOcorrencias],
  ['processos/schemas/processoFormSchema#hojeIso', hojeIsoProcessos],
] as const

function mensagensDoCampo(resultado: { error?: { issues: { path: PropertyKey[]; message: string }[] } }, campo: string) {
  return (resultado.error?.issues ?? []).filter((issue) => issue.path[0] === campo).map((issue) => issue.message)
}

describe.each(VIRADAS)('%s', (_caso, instante, hoje, amanha) => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(instante))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it.each(FUNCOES_DE_HOJE)(`%s devolve ${hoje}`, (_nome, hojeDoCcz) => {
    expect(hojeDoCcz()).toBe(hoje)
  })

  it(`vacinação aceita aplicação em ${hoje} e recusa em ${amanha}`, () => {
    const futura = 'A data de aplicação não pode ser futura.'
    expect(mensagensDoCampo(vacinacaoFormSchema.safeParse({ dataAplicacao: hoje }), 'dataAplicacao')).not.toContain(futura)
    expect(mensagensDoCampo(vacinacaoFormSchema.safeParse({ dataAplicacao: amanha }), 'dataAplicacao')).toContain(futura)
  })

  it(`procedimento aceita ${hoje} e recusa ${amanha}`, () => {
    expect(procedimentoFormSchema.safeParse({ tipoProcedimento: 'castracao', data: hoje }).success).toBe(true)
    expect(mensagensDoCampo(procedimentoFormSchema.safeParse({ tipoProcedimento: 'castracao', data: amanha }), 'data')).toContain(
      'A data do procedimento não pode ser futura.',
    )
  })
})
