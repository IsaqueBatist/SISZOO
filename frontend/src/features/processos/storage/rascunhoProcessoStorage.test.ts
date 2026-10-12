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
    expect(await carregarRascunhoProcesso(chaveRascunhoProcesso(USUARIO_A))).toEqual(rascunho)
    expect(await carregarRascunhoProcesso(chaveRascunhoProcesso(USUARIO_B))).toBeNull()
  })

  it('rascunho antigo sem escopo ("novo") não é lido', async () => {
    await salvarRascunho('processos', 'novo', { etapaAtual: 1, valores: {} })

    expect(await carregarRascunhoProcesso(chaveRascunhoProcesso(USUARIO_A))).toBeNull()
  })
})
