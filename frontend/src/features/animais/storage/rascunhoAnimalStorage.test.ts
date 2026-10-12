import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { salvarRascunho } from '@/lib/rascunhoDb'
import { instalarIndexedDbEmMemoria } from '@/test/indexedDbEmMemoria'
import { carregarRascunhoAnimal, chaveRascunhoAnimal, salvarRascunhoAnimal } from './rascunhoAnimalStorage'

const USUARIO_A = 'a1b2c3d4-0000-0000-0000-00000000000a'
const USUARIO_B = 'a1b2c3d4-0000-0000-0000-00000000000b'

describe('rascunho de animal por usuário', () => {
  beforeEach(() => {
    instalarIndexedDbEmMemoria()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('a chave leva o id do usuário, no cadastro e na edição', () => {
    expect(chaveRascunhoAnimal(USUARIO_A, undefined)).toBe(`${USUARIO_A}:novo`)
    expect(chaveRascunhoAnimal(USUARIO_A, 'animal-1')).toBe(`${USUARIO_A}:editar:animal-1`)
  })

  it('o rascunho de um usuário não aparece para outro', async () => {
    await salvarRascunhoAnimal(chaveRascunhoAnimal(USUARIO_A, undefined), { nome: 'Rex' })

    expect(await carregarRascunhoAnimal(chaveRascunhoAnimal(USUARIO_A, undefined))).toEqual({ nome: 'Rex' })
    expect(await carregarRascunhoAnimal(chaveRascunhoAnimal(USUARIO_B, undefined))).toBeNull()
  })

  it('rascunho antigo sem escopo ("novo") não é lido', async () => {
    await salvarRascunho('animais', 'novo', { nome: 'Legado' })

    expect(await carregarRascunhoAnimal(chaveRascunhoAnimal(USUARIO_A, undefined))).toBeNull()
  })
})
