import { describe, expect, it } from 'vitest'
import type { ProcessoFormValues } from '../schemas/processoFormSchema'
import { amostraVazia, paraRequisicao, valoresVazios } from './processoFormMapeamento'

type Amostra = ProcessoFormValues['amostras'][number]

function comAmostra(amostra: Partial<Amostra>, sobrescrever: Partial<ProcessoFormValues> = {}): ProcessoFormValues {
  return {
    ...valoresVazios(),
    doenca: 'raiva',
    laboratorio: 'pasteur_sp',
    vinculoDecisao: 'sem_vinculo',
    responsavel: { ...valoresVazios().responsavel, nome: '  Maria  ' },
    amostras: [{ ...amostraVazia(), statusClinico: 'ASSINTOMATICO', tipoAbrigo: 'INTRADOMICILIAR', materialBiologico: 'SORO', ...amostra } as Amostra],
    ...sobrescrever,
  }
}

describe('paraRequisicao (POST /api/processos)', () => {
  it('amostra do canil leva só o animalId, sem identificação (DH-5)', () => {
    const [amostra] = paraRequisicao(comAmostra({ origem: 'canil', animalId: 'animal-1' })).amostras

    expect(amostra).toMatchObject({ animalId: 'animal-1' })
    expect(amostra).not.toHaveProperty('especie')
    expect(amostra).not.toHaveProperty('sexo')
  })

  it('amostra de campo leva a identificação, com texto vazio virando undefined', () => {
    const [amostra] = paraRequisicao(
      comAmostra({ origem: 'externo', especie: 'canino', sexo: 'macho', raca: '  ', coloracao: ' Preto ' } as Partial<Amostra>),
    ).amostras

    expect(amostra).toMatchObject({ especie: 'canino', sexo: 'macho', raca: undefined, coloracao: 'Preto' })
    expect(amostra).not.toHaveProperty('animalId')
  })

  it('nível de contato e agressão só vão com contato humano', () => {
    const semContato = paraRequisicao(comAmostra({ contatoHumano: false, nivelContato: 'DIRETA', agrediuHumano: true })).amostras[0]
    const comContato = paraRequisicao(comAmostra({ contatoHumano: true, nivelContato: 'DIRETA', agrediuHumano: false })).amostras[0]

    expect(semContato.nivelContato).toBeUndefined()
    expect(semContato.agrediuHumano).toBeUndefined()
    expect(comContato).toMatchObject({ nivelContato: 'DIRETA', agrediuHumano: false })
  })

  it('sintomas só vão em SINTOMATICO', () => {
    const assintomatico = paraRequisicao(comAmostra({ statusClinico: 'ASSINTOMATICO', sintomas: ['febre'] })).amostras[0]
    const sintomatico = paraRequisicao(comAmostra({ statusClinico: 'SINTOMATICO', sintomas: ['febre'] })).amostras[0]

    expect(assintomatico.sintomas).toEqual([])
    expect(sintomatico.sintomas).toEqual(['febre'])
  })

  it('ocorrência só vai com a decisão "vinculado"; o nome do responsável vai sem espaços', () => {
    const semVinculo = paraRequisicao(comAmostra({}, { vinculoDecisao: 'sem_vinculo', ocorrenciaId: 'oc-1' }))
    const vinculado = paraRequisicao(comAmostra({}, { vinculoDecisao: 'vinculado', ocorrenciaId: 'oc-1' }))

    expect(semVinculo.ocorrenciaId).toBeNull()
    expect(vinculado.ocorrenciaId).toBe('oc-1')
    expect(vinculado.responsavel.nome).toBe('Maria')
    expect(vinculado.galNumero).toBeUndefined()
  })
})
