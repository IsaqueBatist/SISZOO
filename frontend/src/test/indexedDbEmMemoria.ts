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

// O jsdom não tem IndexedDB. Aqui entra a fake-indexeddb, que implementa a
// especificação de verdade (chaves, transações, versionamento) — ao contrário
// do stub caseiro que havia antes, que era um Map e não exercitava nada disso.
// Uma fábrica nova por teste mantém o isolamento entre eles.

// A fake-indexeddb clona o valor na inserção com o structuredClone GLOBAL
// (src/lib/cloneValueForInsertion.ts dela). No jsdom isso é um problema: o
// structuredClone do Node não reconhece um Blob/File do jsdom e devolve um
// objeto VAZIO, sem erro — o arquivo chegaria à store sem conteúdo. Medido no
// jsdom 30: `ctor=Object, size=undefined, arrayBuffer=false`.
// Solução: trocar cada Blob/File por um marcador, deixar o clone nativo cuidar
// do resto e recolocar os arquivos por referência. Do ponto de vista do teste é
// o que o navegador real faz — lá o Blob sobrevive ao round-trip.
// Limite conhecido: cobre objetos simples, arrays e Blob/File nas folhas, que é
// a forma de todos os rascunhos do projeto; não trata referências cíclicas.
const MARCADOR_ARQUIVO = '__arquivoEmTeste__'

interface Marcador {
  [MARCADOR_ARQUIVO]: number
}

function ehArquivo(valor: unknown): valor is Blob {
  if (typeof Blob !== 'undefined' && valor instanceof Blob) return true
  // Blob de outra realm (o do Node, por exemplo) não casa com o instanceof.
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

  // A fábrica é nova a cada teste (isolamento), mas as classes vão todas: a
  // idb faz `instanceof IDBRequest`/`IDBTransaction` internamente, e o jsdom
  // não define nenhuma delas. É a mesma lista que o 'fake-indexeddb/auto'
  // instala — só que por teste, não global na suíte inteira.
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

  // O módulo guarda a conexão aberta; sem isto ela apontaria para o banco do
  // teste anterior, de uma fábrica que acabou de ser descartada.
  esquecerBancoRascunhos()

  // Leitura direta, para as asserções. Devolve o CONTEÚDO de cada rascunho
  // (sem o envelope `{ dados, salvoEm }` da T42), que é o que os testes
  // afirmam; use `registros` quando a data do salvamento importar.
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
