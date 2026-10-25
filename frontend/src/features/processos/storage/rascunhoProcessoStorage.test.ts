import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { salvarRascunho } from '@/lib/rascunhoDb'
import { instalarIndexedDbEmMemoria } from '@/test/indexedDbEmMemoria'
import { carregarRascunhoProcesso, chaveRascunhoProcesso, salvarRascunhoProcesso } from './rascunhoProcessoStorage'

const USUARIO_A = 'a1b2c3d4-0000-0000-0000-00000000000a'
const USUARIO_B = 'a1b2c3d4-0000-0000-0000-00000000000b'

describe('rascunho de processo por usuário', () => {
  beforeEach(() => {
    instalarIndexedDbEmMemoria()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('o rascunho de um usuário não aparece para outro', async () => {
    const rascunho = { etapaAtual: 2 as const, valores: { doenca: 'raiva' } }
    await salvarRascunhoProcesso(chaveRascunhoProcesso(USUARIO_A), rascunho)

    expect(chaveRascunhoProcesso(USUARIO_A)).toBe(`${USUARIO_A}:novo`)
    // T42: a leitura acrescenta o instante do salvamento ao rascunho.
    expect(await carregarRascunhoProcesso(chaveRascunhoProcesso(USUARIO_A))).toMatchObject(rascunho)
    expect(await carregarRascunhoProcesso(chaveRascunhoProcesso(USUARIO_A))).toHaveProperty('salvoEm', expect.any(Number))
    expect(await carregarRascunhoProcesso(chaveRascunhoProcesso(USUARIO_B))).toBeNull()
  })

  it('rascunho antigo sem escopo ("novo") não é lido', async () => {
    await salvarRascunho('processos', 'novo', { etapaAtual: 1, valores: {} })

    expect(await carregarRascunhoProcesso(chaveRascunhoProcesso(USUARIO_A))).toBeNull()
  })

  it('rascunho do contrato anterior (mock, sem versão) não é restaurado', async () => {
    await salvarRascunho('processos', chaveRascunhoProcesso(USUARIO_A), {
      etapaAtual: 3,
      valores: { doenca: 'raiva', amostras: [{ origem: 'externo', especieId: 'canino', statusClinico: 'sintomatico' }] },
    })

    expect(await carregarRascunhoProcesso(chaveRascunhoProcesso(USUARIO_A))).toBeNull()
  })
})
