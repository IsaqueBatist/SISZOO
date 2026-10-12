import { vi } from 'vitest'

// O jsdom não tem IndexedDB e o projeto não depende de fake-indexeddb. Este
// stub cobre só o que lib/rascunhoDb.ts usa (open + upgrade, transaction,
// put/get/delete/clear, oncomplete/onsuccess) para que os testes exercitem as
// chaves e a limpeza de verdade, sem mockar os módulos de storage. Os
// callbacks rodam em microtask, depois de o código registrar os handlers.
export function instalarIndexedDbEmMemoria() {
  const stores = new Map<string, Map<string, unknown>>()

  function requisicao<T>(executar: () => T) {
    const req: { result?: T; onsuccess?: () => void; onerror?: () => void } = {}
    queueMicrotask(() => {
      req.result = executar()
      req.onsuccess?.()
    })
    return req
  }

  function objectStore(nome: string) {
    const dados = stores.get(nome)
    if (!dados) throw new Error(`store inexistente: ${nome}`)
    return {
      put: (valor: unknown, chave: string) => requisicao(() => void dados.set(chave, valor)),
      get: (chave: string) => requisicao(() => dados.get(chave)),
      delete: (chave: string) => requisicao(() => void dados.delete(chave)),
      clear: () => requisicao(() => dados.clear()),
    }
  }

  const banco = {
    objectStoreNames: { contains: (nome: string) => stores.has(nome) },
    createObjectStore: (nome: string) => stores.set(nome, new Map()),
    transaction: () => {
      const transacao: { oncomplete?: () => void; onerror?: () => void; error: null; objectStore: typeof objectStore } = {
        error: null,
        objectStore,
      }
      // Depois das requisições da mesma transação (enfileiradas antes).
      queueMicrotask(() => queueMicrotask(() => transacao.oncomplete?.()))
      return transacao
    },
    close: () => {},
  }

  let versaoAtual = 0
  const open = vi.fn((_nome: string, versao: number) => {
    const req: { result: typeof banco; onupgradeneeded?: () => void; onsuccess?: () => void } = { result: banco }
    queueMicrotask(() => {
      if (versao > versaoAtual) {
        versaoAtual = versao
        req.onupgradeneeded?.()
      }
      req.onsuccess?.()
    })
    return req
  })

  vi.stubGlobal('indexedDB', { open })

  // Leitura direta, para as asserções.
  function conteudo(store: string): Record<string, unknown> {
    return Object.fromEntries(stores.get(store) ?? [])
  }

  return { conteudo }
}
