import {
  IDBCursor,
  IDBCursorWithValue,
  IDBDatabase,
  IDBFactory,
  IDBIndex,
  IDBKeyRange,
  IDBObjectStore,
  IDBOpenDBRequest,
  IDBRequest,
  IDBTransaction,
  IDBVersionChangeEvent,
} from 'fake-indexeddb'
import { vi } from 'vitest'
import { abrirBancoRascunhos, esquecerBancoRascunhos, STORE_ARQUIVOS, type StoreRascunho } from '@/lib/rascunhoDb'

const MARCADOR_ARQUIVO = '__arquivoEmTeste__'

interface Marcador {
  [MARCADOR_ARQUIVO]: number
}

function ehArquivo(valor: unknown): valor is Blob {
  if (typeof Blob !== 'undefined' && valor instanceof Blob) return true
  return (
    typeof valor === 'object' &&
    valor !== null &&
    typeof (valor as Blob).size === 'number' &&
    typeof (valor as Blob).arrayBuffer === 'function'
  )
}

function ehObjetoSimples(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && (valor.constructor === Object || valor.constructor === undefined)
}

function extrairArquivos(valor: unknown, arquivos: Blob[]): unknown {
  if (ehArquivo(valor)) {
    arquivos.push(valor)
    return { [MARCADOR_ARQUIVO]: arquivos.length - 1 } satisfies Marcador
  }
  if (Array.isArray(valor)) return valor.map((item) => extrairArquivos(item, arquivos))
  if (ehObjetoSimples(valor)) {
    return Object.fromEntries(Object.entries(valor).map(([chave, item]) => [chave, extrairArquivos(item, arquivos)]))
  }
  return valor
}

function recolocarArquivos(valor: unknown, arquivos: Blob[]): unknown {
  if (ehObjetoSimples(valor) && typeof valor[MARCADOR_ARQUIVO] === 'number') {
    return arquivos[valor[MARCADOR_ARQUIVO]]
  }
  if (Array.isArray(valor)) return valor.map((item) => recolocarArquivos(item, arquivos))
  if (ehObjetoSimples(valor)) {
    return Object.fromEntries(Object.entries(valor).map(([chave, item]) => [chave, recolocarArquivos(item, arquivos)]))
  }
  return valor
}

export function instalarIndexedDbEmMemoria() {
  const cloneNativo = structuredClone

  vi.stubGlobal('indexedDB', new IDBFactory())
  vi.stubGlobal('IDBFactory', IDBFactory)
  vi.stubGlobal('IDBCursor', IDBCursor)
  vi.stubGlobal('IDBCursorWithValue', IDBCursorWithValue)
  vi.stubGlobal('IDBDatabase', IDBDatabase)
  vi.stubGlobal('IDBIndex', IDBIndex)
  vi.stubGlobal('IDBKeyRange', IDBKeyRange)
  vi.stubGlobal('IDBObjectStore', IDBObjectStore)
  vi.stubGlobal('IDBOpenDBRequest', IDBOpenDBRequest)
  vi.stubGlobal('IDBRequest', IDBRequest)
  vi.stubGlobal('IDBTransaction', IDBTransaction)
  vi.stubGlobal('IDBVersionChangeEvent', IDBVersionChangeEvent)
  vi.stubGlobal('structuredClone', (valor: unknown) => {
    const arquivos: Blob[] = []
    return recolocarArquivos(cloneNativo(extrairArquivos(valor, arquivos)), arquivos)
  })

  esquecerBancoRascunhos()

  async function conteudo(store: string): Promise<Record<string, unknown>> {
    const bruto = await registros(store)
    return Object.fromEntries(
      Object.entries(bruto).map(([chave, registro]) => [
        chave,
        registro !== null && typeof registro === 'object' && 'dados' in registro
          ? (registro as { dados: unknown }).dados
          : registro,
      ]),
    )
  }

  async function registros(store: string): Promise<Record<string, unknown>> {
    const banco = await abrirBancoRascunhos()
    const nome = store as StoreRascunho | typeof STORE_ARQUIVOS
    const pares = await Promise.all(
      (await banco.getAllKeys(nome)).map(async (chave) => [String(chave), await banco.get(nome, chave)] as const),
    )
    return Object.fromEntries(pares)
  }

  return { conteudo, registros }
}
