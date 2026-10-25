import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { instalarIndexedDbEmMemoria } from '@/test/indexedDbEmMemoria'
import {
  agendarSalvarRascunho,
  carregarArquivoRascunho,
  limparRascunhos,
  salvarArquivoRascunho,
  salvarRascunho,
  STORE_ARQUIVOS,
} from './rascunhoDb'

describe('limparRascunhos', () => {
  let conteudo: (store: string) => Promise<Record<string, unknown>>

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
    await salvarRascunho('clinico', 'u1:vacina:a1', { lote: 'L1' })

    await limparRascunhos()

    expect(await conteudo('animais')).toEqual({})
    expect(await conteudo('ocorrencias')).toEqual({})
    expect(await conteudo('processos')).toEqual({})
    expect(await conteudo('clinico')).toEqual({})
  })

  it('apaga também os arquivos anexados aos rascunhos (T42)', async () => {
    const referencia = await salvarArquivoRascunho(
      'u1',
      { store: 'ocorrencias', chave: 'u1:novo' },
      new File(['anexo'], 'a.png', { type: 'image/png' }),
    )

    await limparRascunhos()

    expect(await conteudo(STORE_ARQUIVOS)).toEqual({})
    expect(await carregarArquivoRascunho('u1', referencia!.id)).toBeNull()
  })

  it('cancela o salvamento agendado: nada é gravado depois da limpeza', async () => {
    // Só setTimeout/clearTimeout são falsificados: a fake-indexeddb agenda o
    // próprio trabalho com setImmediate, e falsificar tudo trava a transação
    // que limparRascunhos aguarda.
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    agendarSalvarRascunho('ocorrencias', 'u1:novo', { bairro: 'X' }, 800)

    await limparRascunhos()
    await vi.advanceTimersByTimeAsync(2000)

    expect(await conteudo('ocorrencias')).toEqual({})
  })
})
