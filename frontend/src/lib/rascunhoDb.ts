// Banco IndexedDB único dos rascunhos de formulário (rede do CCZ é instável:
// formulário longo não pode perder dados numa queda de conexão).
//
// Por que um módulo só: animais, ocorrências e processos abriam o mesmo banco
// 'siszoo-rascunhos' na versão 1, cada um criando a PRÓPRIA store no
// onupgradeneeded. Esse evento só dispara quando a versão sobe — então, no
// navegador real, só a store do primeiro formulário aberto existia e os
// outros rascunhos falhavam em silêncio. Aqui a versão é 2 e o upgrade cria
// todas as stores de uma vez; para incluir uma store nova, acrescente o nome
// em STORES_RASCUNHO e suba VERSAO_BANCO.
const NOME_BANCO = 'siszoo-rascunhos'
const VERSAO_BANCO = 2

export const STORES_RASCUNHO = ['animais', 'ocorrencias', 'processos'] as const
export type StoreRascunho = (typeof STORES_RASCUNHO)[number]

function indexedDbDisponivel(): boolean {
  return typeof indexedDB !== 'undefined'
}

export function abrirBancoRascunhos(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const requisicao = indexedDB.open(NOME_BANCO, VERSAO_BANCO)
    requisicao.onupgradeneeded = () => {
      for (const store of STORES_RASCUNHO) {
        if (!requisicao.result.objectStoreNames.contains(store)) {
          requisicao.result.createObjectStore(store)
        }
      }
    }
    requisicao.onsuccess = () => resolve(requisicao.result)
    requisicao.onerror = () => reject(requisicao.error)
  })
}

// Rascunho é melhor esforço: falha de IndexedDB (modo privado, quota,
// navegador sem suporte) nunca deve quebrar o formulário — por isso as três
// operações engolem o erro.
export async function salvarRascunho<T>(store: StoreRascunho, chave: string, valores: T): Promise<void> {
  if (!indexedDbDisponivel()) return
  try {
    const banco = await abrirBancoRascunhos()
    await new Promise<void>((resolve, reject) => {
      const transacao = banco.transaction(store, 'readwrite')
      transacao.objectStore(store).put(valores, chave)
      transacao.oncomplete = () => resolve()
      transacao.onerror = () => reject(transacao.error)
    })
    banco.close()
  } catch {
    // idem
  }
}

export async function carregarRascunho<T>(store: StoreRascunho, chave: string): Promise<T | null> {
  if (!indexedDbDisponivel()) return null
  try {
    const banco = await abrirBancoRascunhos()
    const valor = await new Promise<T | null>((resolve, reject) => {
      const transacao = banco.transaction(store, 'readonly')
      const requisicao = transacao.objectStore(store).get(chave)
      requisicao.onsuccess = () => resolve((requisicao.result as T | undefined) ?? null)
      requisicao.onerror = () => reject(requisicao.error)
    })
    banco.close()
    return valor
  } catch {
    return null
  }
}

export async function removerRascunho(store: StoreRascunho, chave: string): Promise<void> {
  if (!indexedDbDisponivel()) return
  try {
    const banco = await abrirBancoRascunhos()
    await new Promise<void>((resolve, reject) => {
      const transacao = banco.transaction(store, 'readwrite')
      transacao.objectStore(store).delete(chave)
      transacao.oncomplete = () => resolve()
      transacao.onerror = () => reject(transacao.error)
    })
    banco.close()
  } catch {
    // idem
  }
}
