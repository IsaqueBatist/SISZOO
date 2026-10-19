import { describe, expect, it } from 'vitest'
import { hojeEmItu } from '@/lib/datas'
import { adicionarDiasIso } from '@/test/datas'
import { animalFormSchema } from './animalFormSchema'
import { prescricaoFormSchema, procedimentoFormSchema } from './historicoFormSchemas'

function mensagensDoCampo(resultado: { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } }, campo: string) {
  return (resultado.error?.issues ?? []).filter((issue) => issue.path[0] === campo).map((issue) => issue.message)
}

const HOJE = hojeEmItu()
const AMANHA = adicionarDiasIso(HOJE, 1)

describe('animalFormSchema — datas', () => {
  const base = {
    nome: 'Rex',
    especie: 'canino',
    sexo: 'macho',
    esterilizado: false,
    status: 'em_tratamento',
    motivoEntrada: 'resgate',
    dataEntrada: HOJE,
  }

  it('aceita datas de hoje', () => {
    expect(animalFormSchema.safeParse({ ...base, dataNascimentoAprox: HOJE, dataEsterilizacao: HOJE }).success).toBe(true)
  })

  it('recusa entrada, nascimento e castração futuras', () => {
    const resultado = animalFormSchema.safeParse({
      ...base,
      dataEntrada: AMANHA,
      dataNascimentoAprox: AMANHA,
      dataEsterilizacao: AMANHA,
    })
    expect(mensagensDoCampo(resultado, 'dataEntrada')).toContain('A data de entrada não pode ser futura.')
    expect(mensagensDoCampo(resultado, 'dataNascimentoAprox')).toContain('A data de nascimento não pode ser futura.')
    expect(mensagensDoCampo(resultado, 'dataEsterilizacao')).toContain('A data da castração não pode ser futura.')
  })
})

describe('procedimentoFormSchema', () => {
  it('recusa data futura e aceita hoje', () => {
    expect(procedimentoFormSchema.safeParse({ tipoProcedimento: 'castracao', data: HOJE }).success).toBe(true)
    const resultado = procedimentoFormSchema.safeParse({ tipoProcedimento: 'castracao', data: AMANHA })
    expect(mensagensDoCampo(resultado, 'data')).toContain('A data do procedimento não pode ser futura.')
  })
})

describe('prescricaoFormSchema', () => {
  const base = {
    medicamentoId: 'm1',
    dataInicio: '2026-05-10',
    dataFimPrevista: '',
    dataFimReal: '',
    frequenciaAplicada: 8,
    unidadeFrequencia: 'HORAS',
    doseQuantidade: 10,
    doseUnidade: 'MILIGRAMA',
    viaAdministracao: 'ORAL',
    status: 'ATIVA',
  }

  it('aceita início futuro (programado) e términos no mesmo dia do início', () => {
    const futuro = adicionarDiasIso(HOJE, 30)
    expect(
      prescricaoFormSchema.safeParse({ ...base, dataInicio: futuro, dataFimPrevista: futuro, dataFimReal: futuro, status: 'CONCLUIDA' })
        .success,
    ).toBe(true)
  })

  it('recusa términos anteriores ao início', () => {
    const resultado = prescricaoFormSchema.safeParse({ ...base, dataFimPrevista: '2026-05-09', dataFimReal: '2026-05-09' })
    expect(mensagensDoCampo(resultado, 'dataFimPrevista')).toContain('O término previsto não pode ser anterior ao início.')
    expect(mensagensDoCampo(resultado, 'dataFimReal')).toContain('O término real não pode ser anterior ao início.')
  })

  it('exige término real para concluir', () => {
    const resultado = prescricaoFormSchema.safeParse({ ...base, status: 'CONCLUIDA' })
    expect(mensagensDoCampo(resultado, 'dataFimReal')).toContain('Informe o término real para concluir a prescrição.')
  })
})
