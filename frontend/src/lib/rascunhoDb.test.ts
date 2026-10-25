import { openDB } from 'idb'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { instalarIndexedDbEmMemoria } from '@/test/indexedDbEmMemoria'
import {
  abrirBancoRascunhos,
  carregarArquivoRascunho,
  carregarRascunho,
  esquecerBancoRascunhos,
  limparRascunhosExpirados,
  removerArquivosDoRascunho,
  salvarArquivoRascunho,
  salvarRascunho,
  STORE_ARQUIVOS,
  STORES_RASCUNHO,
  VALIDADE_RASCUNHO_MS,
} from './rascunhoDb'

const USUARIO = 'a1b2c3d4-0000-0000-0000-00000000000a'
const NOME_BANCO = 'siszoo-rascunhos'

// Cria o banco numa versão ANTERIOR, com só parte das stores — o cenário real
// do defeito corrigido na versão 2: o primeiro formulário aberto criava a sua
// store e as outras nunca eram criadas.
async function bancoAntigo(versao: number, stores: string[], semear?: (banco: Awaited<ReturnType<typeof openDB>>) => Promise<unknown>) {
  const banco = await openDB(NOME_BANCO, versao, {
    upgrade(db) {
      for (const store of stores) db.createObjectStore(store)
    },
  })
  await semear?.(banco)
  banco.close()
}

// Grava direto, sem passar por salvarRascunho, para datar o registro no passado.
// Não fecha a conexão: ela é compartilhada pelo módulo (ver abrirBancoRascunhos).
async function gravarComData(store: string, chave: string, dados: unknown, salvoEm: number) {
  const banco = await abrirBancoRascunhos()
  await banco.put(store as 'animais', { dados, salvoEm } as never, chave)
}

describe('banco de rascunhos compartilhado', () => {
  beforeEach(() => {
    instalarIndexedDbEmMemoria()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('cria todas as stores quando o banco não existe', async () => {
    const banco = await abrirBancoRascunhos()

    expect([...banco.objectStoreNames].sort()).toEqual([...STORES_RASCUNHO].sort())
    expect(banco.version).toBe(4)
  })

  it('da versão 1 com uma store só, cria as que faltam e preserva o que havia', async () => {
    await bancoAntigo(1, ['animais'], (db) => db.put('animais', { nome: 'Rex' }, `${USUARIO}:novo`))

    const banco = await abrirBancoRascunhos()

    expect([...banco.objectStoreNames].sort()).toEqual([...STORES_RASCUNHO].sort())
    expect(await banco.get('animais', `${USUARIO}:novo`)).toEqual({ nome: 'Rex' })
  })

  it('da versão 3 para a 4 só cria a store arquivos e não apaga as existentes', async () => {
    await bancoAntigo(3, ['animais', 'ocorrencias', 'processos', 'clinico'], (db) =>
      db.put('processos', { etapaAtual: 2 }, `${USUARIO}:novo`),
    )

    const banco = await abrirBancoRascunhos()

    expect(banco.objectStoreNames.contains(STORE_ARQUIVOS)).toBe(true)
    expect([...banco.objectStoreNames].sort()).toEqual([...STORES_RASCUNHO].sort())
    expect(await banco.get('processos', `${USUARIO}:novo`)).toEqual({ etapaAtual: 2 })
  })
})

describe('registro de rascunho com data de salvamento', () => {
  beforeEach(() => {
    instalarIndexedDbEmMemoria()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('guarda os valores e o instante do salvamento', async () => {
    const antes = Date.now()
    await salvarRascunho('animais', `${USUARIO}:novo`, { nome: 'Rex' })

    const registro = await carregarRascunho<{ nome: string }>('animais', `${USUARIO}:novo`)

    expect(registro?.dados).toEqual({ nome: 'Rex' })
    expect(registro?.salvoEm).toBeGreaterThanOrEqual(antes)
  })

  it('rascunho gravado antes da T42 (sem envelope) continua restaurável, sem data', async () => {
    const banco = await abrirBancoRascunhos()
    await banco.put('animais', { nome: 'Legado' } as never, `${USUARIO}:novo`)

    const registro = await carregarRascunho<{ nome: string }>('animais', `${USUARIO}:novo`)

    expect(registro).toEqual({ dados: { nome: 'Legado' }, salvoEm: null })
  })

  it('rascunho vencido não é oferecido e sai do disco na leitura', async () => {
    const chave = `${USUARIO}:novo`
    await gravarComData('animais', chave, { nome: 'Antigo' }, Date.now() - VALIDADE_RASCUNHO_MS - 1000)

    expect(await carregarRascunho('animais', chave)).toBeNull()

    const banco = await abrirBancoRascunhos()
    expect(await banco.get('animais', chave)).toBeUndefined()
  })

  it('rascunho dentro do prazo é mantido', async () => {
    const chave = `${USUARIO}:novo`
    await gravarComData('animais', chave, { nome: 'Recente' }, Date.now() - VALIDADE_RASCUNHO_MS + 60_000)

    expect(await carregarRascunho<{ nome: string }>('animais', chave)).toMatchObject({ dados: { nome: 'Recente' } })
  })
})

describe('arquivos do rascunho', () => {
  let conteudo: (store: string) => Promise<Record<string, unknown>>
  const dono = { store: 'ocorrencias', chave: `${USUARIO}:novo` } as const

  beforeEach(() => {
    conteudo = instalarIndexedDbEmMemoria().conteudo
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function arquivo(nome = 'a.png') {
    return new File(['conteudo-do-anexo'], nome, { type: 'image/png' })
  }

  it('grava o Blob e devolve só a referência, sem o conteúdo', async () => {
    const referencia = await salvarArquivoRascunho(USUARIO, dono, arquivo())

    expect(referencia).toMatchObject({ nome: 'a.png', tipo: 'image/png', tamanho: 17 })
    expect(referencia?.id).toBeTruthy()
    expect(Object.keys(referencia!).sort()).toEqual(['id', 'nome', 'tamanho', 'tipo'])
  })

  it('o Blob volta com o conteúdo intacto', async () => {
    const referencia = await salvarArquivoRascunho(USUARIO, dono, arquivo())

    const blob = await carregarArquivoRascunho(USUARIO, referencia!.id)

    expect(blob).not.toBeNull()
    expect(await blob!.text()).toBe('conteudo-do-anexo')
  })

  it('o arquivo de um usuário não é alcançável por outro', async () => {
    const referencia = await salvarArquivoRascunho(USUARIO, dono, arquivo())

    expect(await carregarArquivoRascunho('outro-usuario', referencia!.id)).toBeNull()
  })

  it('remover os arquivos do rascunho não toca nos de outro rascunho', async () => {
    const daOcorrencia = await salvarArquivoRascunho(USUARIO, dono, arquivo('oco.png'))
    const doAnimal = await salvarArquivoRascunho(USUARIO, { store: 'animais', chave: `${USUARIO}:novo` }, arquivo('foto.png'))

    await removerArquivosDoRascunho(dono)

    expect(await carregarArquivoRascunho(USUARIO, daOcorrencia!.id)).toBeNull()
    expect(await carregarArquivoRascunho(USUARIO, doAnimal!.id)).not.toBeNull()
  })

  it('falha de gravação (cota) devolve null sem lançar', async () => {
    // A conexão fica em cache no módulo: descartá-la obriga a próxima operação
    // a abrir o banco de novo, que é onde a falha é simulada. Depois do
    // mockRestore o cache já está limpo, porque abrirBancoRascunhos não guarda
    // uma abertura que falhou.
    esquecerBancoRascunhos()
    vi.spyOn(indexedDB, 'open').mockImplementation(() => {
      throw new DOMException('cota', 'QuotaExceededError')
    })

    expect(await salvarArquivoRascunho(USUARIO, dono, arquivo())).toBeNull()

    vi.mocked(indexedDB.open).mockRestore()
    expect(await conteudo(STORE_ARQUIVOS)).toEqual({})
  })
})

describe('limparRascunhosExpirados', () => {
  let conteudo: (store: string) => Promise<Record<string, unknown>>

  beforeEach(() => {
    conteudo = instalarIndexedDbEmMemoria().conteudo
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('apaga os rascunhos vencidos e mantém os recentes', async () => {
    await gravarComData('animais', `${USUARIO}:antigo`, { nome: 'Antigo' }, Date.now() - VALIDADE_RASCUNHO_MS - 1000)
    await salvarRascunho('animais', `${USUARIO}:novo`, { nome: 'Recente' })

    await limparRascunhosExpirados()

    expect(Object.keys(await conteudo('animais'))).toEqual([`${USUARIO}:novo`])
  })

  it('apaga o arquivo cujo rascunho não existe mais (órfão)', async () => {
    const orfao = await salvarArquivoRascunho(USUARIO, { store: 'ocorrencias', chave: `${USUARIO}:nunca-gravado` }, new File(['x'], 'x.png'))
    await salvarRascunho('ocorrencias', `${USUARIO}:novo`, { bairro: 'Centro' })
    const vinculado = await salvarArquivoRascunho(USUARIO, { store: 'ocorrencias', chave: `${USUARIO}:novo` }, new File(['y'], 'y.png'))

    await limparRascunhosExpirados()

    expect(await carregarArquivoRascunho(USUARIO, orfao!.id)).toBeNull()
    expect(await carregarArquivoRascunho(USUARIO, vinculado!.id)).not.toBeNull()
  })

  it('apaga o arquivo vencido junto com o rascunho vencido', async () => {
    const chave = `${USUARIO}:novo`
    await gravarComData('ocorrencias', chave, { bairro: 'Centro' }, Date.now() - VALIDADE_RASCUNHO_MS - 1000)
    const referencia = await salvarArquivoRascunho(USUARIO, { store: 'ocorrencias', chave }, new File(['z'], 'z.png'))

    await limparRascunhosExpirados()

    expect(await conteudo('ocorrencias')).toEqual({})
    expect(await carregarArquivoRascunho(USUARIO, referencia!.id)).toBeNull()
  })
})
