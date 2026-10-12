import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { instalarIndexedDbEmMemoria } from '@/test/indexedDbEmMemoria'
import { agendarSalvarRascunho, limparRascunhos, salvarRascunho } from './rascunhoDb'

describe('limparRascunhos', () => {
  let conteudo: (store: string) => Record<string, unknown>

  beforeEach(() => {
    conteudo = instalarIndexedDbEmMemoria().conteudo
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('apaga todas as stores, de todos os usuários e chaves antigas', async () => {
    await salvarRascunho('animais', 'u1:novo', { nome: 'Rex' })
    await salvarRascunho('ocorrencias', 'u2:anexos-pendentes', { anexos: [] })
    await salvarRascunho('processos', 'novo', { etapaAtual: 1 })

    await limparRascunhos()

    expect(conteudo('animais')).toEqual({})
    expect(conteudo('ocorrencias')).toEqual({})
    expect(conteudo('processos')).toEqual({})
  })

  it('cancela o salvamento agendado: nada é gravado depois da limpeza', async () => {
    vi.useFakeTimers()
    agendarSalvarRascunho('ocorrencias', 'u1:novo', { bairro: 'X' }, 800)

    await limparRascunhos()
    await vi.advanceTimersByTimeAsync(2000)

    expect(conteudo('ocorrencias')).toEqual({})
  })
})
