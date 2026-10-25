import { describe, expect, it } from 'vitest'
import { criarOcorrenciaFixture } from '@/mocks/ocorrenciasFixtures'
import type { OcorrenciaFormValues } from '../schemas/ocorrenciaFormSchema'
import { paraAtualizacao, paraRequisicao, valoresDaOcorrencia, valoresVazios } from './ocorrenciaFormMapeamento'

function valores(sobrescrever: Partial<OcorrenciaFormValues> = {}): OcorrenciaFormValues {
  return {
    ...valoresVazios(),
    dataAbertura: '2026-05-20',
    endereco: 'Rua A, 10',
    bairro: 'Centro',
    descricao: 'Cão solto',
    ...sobrescrever,
  }
}

const SEM_ALTERACAO = { denunciante: false, denunciado: false }

describe('paraRequisicao (POST)', () => {
  it('troca string vazia por undefined nos opcionais', () => {
    const corpo = paraRequisicao(valores({ denunciante: { ...valoresVazios().denunciante, nome: 'Maria' } }))

    expect(corpo.horaAbertura).toBeUndefined()
    expect(corpo.pontoReferencia).toBeUndefined()
    expect(corpo.denunciante).toEqual({
      nome: 'Maria',
      cpf: undefined,
      telefone: undefined,
      email: undefined,
      cep: undefined,
      endereco: undefined,
      bairroResidencial: undefined,
    })
  })

  it('anônima nunca manda o bloco do denunciante (D32), nem com dados', () => {
    const corpo = paraRequisicao(valores({ anonima: true, denunciante: { ...valoresVazios().denunciante, nome: 'Maria' } }))

    expect(corpo.denunciante).toBeUndefined()
  })

  it('bloco do denunciante sem nenhum dado não é enviado', () => {
    expect(paraRequisicao(valores({ sigilosa: true })).denunciante).toBeUndefined()
  })

  it('denunciado só vai com o seletor ligado', () => {
    const dados = { nome: 'João', cpf: '', telefone: '', endereco: '', observacoes: '' }

    expect(paraRequisicao(valores({ denunciado: dados })).denunciado).toBeUndefined()
    expect(paraRequisicao(valores({ denunciadoAtivo: true, denunciado: dados })).denunciado).toMatchObject({ nome: 'João' })
  })
})

describe('paraAtualizacao (PUT, D10)', () => {
  const original = criarOcorrenciaFixture()

  it('sem alteração nos blocos, nenhum dos dois vai', () => {
    const corpo = paraAtualizacao(valores({ denunciante: { ...valoresVazios().denunciante, nome: 'Maria' } }), original, SEM_ALTERACAO, false)

    expect(corpo.denunciante).toBeUndefined()
    expect(corpo.denunciado).toBeUndefined()
  })

  it('denunciante alterado e esvaziado vai como bloco vazio (substitui o inteiro)', () => {
    const corpo = paraAtualizacao(valores(), original, { denunciante: true, denunciado: false }, false)

    expect(corpo.denunciante).toEqual({})
  })

  it('denunciante mascarado nunca é reenviado, mesmo marcado como alterado', () => {
    const corpo = paraAtualizacao(valores(), original, { denunciante: true, denunciado: false }, true)

    expect(corpo.denunciante).toBeUndefined()
  })

  it('identificar uma anônima manda o bloco sem precisar de alteração marcada', () => {
    const anonima = criarOcorrenciaFixture({ anonima: true })
    const corpo = paraAtualizacao(
      valores({ anonima: false, denunciante: { ...valoresVazios().denunciante, nome: 'Maria' } }),
      anonima,
      SEM_ALTERACAO,
      false,
    )

    expect(corpo.anonima).toBe(false)
    expect(corpo.denunciante).toMatchObject({ nome: 'Maria' })
  })

  it('desligar "existe denunciado" manda o bloco vazio, que limpa os dados', () => {
    const corpo = paraAtualizacao(valores({ denunciadoAtivo: false }), original, { denunciante: false, denunciado: true }, false)

    expect(corpo.denunciado).toEqual({})
  })
})

describe('valoresDaOcorrencia (edição)', () => {
  it('denunciante mascarado entra vazio', () => {
    const ocorrencia = criarOcorrenciaFixture({
      sigilosa: true,
      denunciante: {
        nome: null,
        cpf: null,
        telefone: null,
        email: null,
        cep: null,
        endereco: null,
        bairroResidencial: null,
      },
    })

    expect(valoresDaOcorrencia(ocorrencia, true).denunciante).toEqual(valoresVazios().denunciante)
  })

  it('hora vem sem os segundos e o denunciado ausente desliga o seletor', () => {
    const iniciais = valoresDaOcorrencia(criarOcorrenciaFixture({ horaAbertura: '14:30:00', denunciado: null }), false)

    expect(iniciais.horaAbertura).toBe('14:30')
    expect(iniciais.denunciadoAtivo).toBe(false)
  })
})
