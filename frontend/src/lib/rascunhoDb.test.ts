import { afterEach, describe, expect, it, vi } from 'vitest'
import { abrirBancoRascunhos, STORES_RASCUNHO } from './rascunhoDb'

// O jsdom não tem IndexedDB: um stub mínimo de indexedDB.open simula o
// upgrade de um banco que já existia na versão 1 com só uma das stores
// (cenário real do defeito: o primeiro formulário aberto criava a sua e as
// outras nunca eram criadas).
function stubIndexedDb(storesExistentes: string[]) {
  const stores = new Set(storesExistentes)
  const banco = {
    objectStoreNames: { contains: (nome: string) => stores.has(nome) },
    createObjectStore: vi.fn((nome: string) => stores.add(nome)),
    deleteObjectStore: vi.fn((nome: string) => stores.delete(nome)),
  }
  const open = vi.fn((_nome: string, versao: number) => {
    const requisicao: Record<string, unknown> = { result: banco }
    queueMicrotask(() => {
      if (versao > 1) (requisicao.onupgradeneeded as () => void)()
      ;(requisicao.onsuccess as () => void)()
    })
    return requisicao
  })
  vi.stubGlobal('indexedDB', { open })
  return { banco, open, stores }
}

describe('banco de rascunhos compartilhado', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('abre siszoo-rascunhos acima da versão 1 e cria todas as stores que faltam', async () => {
    const { open, banco, stores } = stubIndexedDb(['animais'])

    await abrirBancoRascunhos()

    expect(open).toHaveBeenCalledWith('siszoo-rascunhos', 3)
    expect(banco.createObjectStore).toHaveBeenCalledTimes(STORES_RASCUNHO.length - 1)
    expect([...stores].sort()).toEqual([...STORES_RASCUNHO].sort())
  })

  it('da versão 2 para a 3 só cria a store clinico e não apaga as existentes', async () => {
    const { banco, stores } = stubIndexedDb(['animais', 'ocorrencias', 'processos'])

    await abrirBancoRascunhos()

    expect(banco.createObjectStore).toHaveBeenCalledTimes(1)
    expect(banco.createObjectStore).toHaveBeenCalledWith('clinico')
    expect(banco.deleteObjectStore).not.toHaveBeenCalled()
    expect(stores.has('animais')).toBe(true)
  })

  it('não recria stores que já existem', async () => {
    const { banco } = stubIndexedDb([...STORES_RASCUNHO])

    await abrirBancoRascunhos()

    expect(banco.createObjectStore).not.toHaveBeenCalled()
  })
})
