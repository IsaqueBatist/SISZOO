// Rascunho local do formulário de animal em IndexedDB nativo (sem
// dependência) — exigência do frontend/CLAUDE.md para formulários longos
// ("cadastro de animal"), já que a rede do CCZ é instável e o form não pode
// perder dados preenchidos numa queda de conexão.
const NOME_BANCO = 'siszoo-rascunhos'
const NOME_STORE = 'animais'
const VERSAO_BANCO = 1
const DEBOUNCE_MS = 800

export function chaveRascunhoAnimal(id: string | undefined): string {
  return id ? `editar:${id}` : 'novo'
}

function indexedDbDisponivel(): boolean {
  return typeof indexedDB !== 'undefined'
}

function abrirBanco(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const requisicao = indexedDB.open(NOME_BANCO, VERSAO_BANCO)
    requisicao.onupgradeneeded = () => {
      if (!requisicao.result.objectStoreNames.contains(NOME_STORE)) {
        requisicao.result.createObjectStore(NOME_STORE)
      }
    }
    requisicao.onsuccess = () => resolve(requisicao.result)
    requisicao.onerror = () => reject(requisicao.error)
  })
}

export async function salvarRascunhoAnimal<T>(chave: string, valores: T): Promise<void> {
  if (!indexedDbDisponivel()) return
  try {
    const banco = await abrirBanco()
    await new Promise<void>((resolve, reject) => {
      const transacao = banco.transaction(NOME_STORE, 'readwrite')
      transacao.objectStore(NOME_STORE).put(valores, chave)
      transacao.oncomplete = () => resolve()
      transacao.onerror = () => reject(transacao.error)
    })
    banco.close()
  } catch {
    // Rascunho é um "nice to have": falha de IndexedDB (modo privado, quota,
    // navegador sem suporte) nunca deve quebrar o formulário.
  }
}

export async function carregarRascunhoAnimal<T>(chave: string): Promise<T | null> {
  if (!indexedDbDisponivel()) return null
  try {
    const banco = await abrirBanco()
    const valor = await new Promise<T | null>((resolve, reject) => {
      const transacao = banco.transaction(NOME_STORE, 'readonly')
      const requisicao = transacao.objectStore(NOME_STORE).get(chave)
      requisicao.onsuccess = () => resolve((requisicao.result as T | undefined) ?? null)
      requisicao.onerror = () => reject(requisicao.error)
    })
    banco.close()
    return valor
  } catch {
    return null
  }
}

export async function removerRascunhoAnimal(chave: string): Promise<void> {
  if (!indexedDbDisponivel()) return
  try {
    const banco = await abrirBanco()
    await new Promise<void>((resolve, reject) => {
      const transacao = banco.transaction(NOME_STORE, 'readwrite')
      transacao.objectStore(NOME_STORE).delete(chave)
      transacao.oncomplete = () => resolve()
      transacao.onerror = () => reject(transacao.error)
    })
    banco.close()
  } catch {
    // idem: melhor esforço, não propaga erro.
  }
}

const timeoutsAgendados = new Map<string, ReturnType<typeof setTimeout>>()

// Debounce por chave: evita gravar no IndexedDB a cada tecla digitada.
export function agendarSalvarRascunhoAnimal<T>(chave: string, valores: T): void {
  const timeoutAnterior = timeoutsAgendados.get(chave)
  if (timeoutAnterior) clearTimeout(timeoutAnterior)

  const novoTimeout = setTimeout(() => {
    timeoutsAgendados.delete(chave)
    void salvarRascunhoAnimal(chave, valores)
  }, DEBOUNCE_MS)
  timeoutsAgendados.set(chave, novoTimeout)
}
