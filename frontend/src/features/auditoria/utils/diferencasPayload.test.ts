import { describe, expect, it } from 'vitest'
import { diferencasDoEvento, justificativaDoEvento } from './diferencasPayload'

describe('diferencasDoEvento', () => {
  it('mostra só o que mudou, com rótulo e os dois valores', () => {
    const antes = JSON.stringify({ galNumero: null, responsavel: { nome: 'Ana', cpf: '111' }, processo: { laboratorio: 'pasteur_sp' } })
    const depois = JSON.stringify({ galNumero: 'GAL-1', responsavel: { nome: 'Ana', cpf: '222' }, processo: { laboratorio: 'pasteur_sp' } })

    expect(diferencasDoEvento(antes, depois)).toEqual([
      { campo: 'Nº GAL', antes: '—', depois: 'GAL-1' },
      { campo: 'Responsável · CPF', antes: '111', depois: '222' },
    ])
  })

  it('identifica a amostra e mostra "não informado" distinto de "não"', () => {
    const antes = JSON.stringify({ processo: { amostras: [{ id: 'a', contatoHumano: null }] } })
    const depois = JSON.stringify({ processo: { amostras: [{ id: 'a', contatoHumano: false }] } })

    expect(diferencasDoEvento(antes, depois)).toEqual([{ campo: 'Amostra 1 · Contato humano-animal', antes: '—', depois: 'Não' }])
  })

  it('evento sem payload anterior mostra os valores novos, e JSON inválido não quebra', () => {
    expect(diferencasDoEvento(null, JSON.stringify({ senhaRedefinida: true }))).toEqual([
      { campo: 'Senha redefinida', antes: '—', depois: 'Sim' },
    ])
    expect(diferencasDoEvento('{quebrado', null)).toEqual([])
  })

  it('a justificativa não entra na comparação', () => {
    expect(diferencasDoEvento('{}', JSON.stringify({ justificativa: 'Motivo' }))).toEqual([])
  })
})

describe('justificativaDoEvento', () => {
  it('lê a justificativa do estado depois', () => {
    expect(justificativaDoEvento(JSON.stringify({ justificativa: 'Motivo da correção' }))).toBe('Motivo da correção')
    expect(justificativaDoEvento(JSON.stringify({ ativo: true }))).toBeNull()
    expect(justificativaDoEvento(null)).toBeNull()
  })
})
