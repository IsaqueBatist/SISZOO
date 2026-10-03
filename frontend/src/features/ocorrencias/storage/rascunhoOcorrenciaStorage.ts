// Rascunho local do formulário de cadastro de ocorrência em IndexedDB
// nativo (mesma infraestrutura de rascunhoAnimalStorage.ts, store próprio) —
// exigência de negócio para formulários longos ("cadastro de ocorrência",
// frontend/CLAUDE.md), já que a rede do CCZ é instável. T27 não inclui
// edição de ocorrência existente, então há uma única chave fixa ('novo'),
// diferente do rascunho de animal (que distingue criação de edição por id).
const NOME_BANCO = 'siszoo-rascunhos'
const NOME_STORE = 'ocorrencias'
const VERSAO_BANCO = 1
const DEBOUNCE_MS = 800
const CHAVE_RASCUNHO = 'novo'

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

export async function salvarRascunhoOcorrencia<T>(valores: T): Promise<void> {
  if (!indexedDbDisponivel()) return
  try {
    const banco = await abrirBanco()
    await new Promise<void>((resolve, reject) => {
      const transacao = banco.transaction(NOME_STORE, 'readwrite')
      transacao.objectStore(NOME_STORE).put(valores, CHAVE_RASCUNHO)
      transacao.oncomplete = () => resolve()
      transacao.onerror = () => reject(transacao.error)
    })
    banco.close()
  } catch {
    // Rascunho é um "nice to have": falha de IndexedDB (modo privado, quota,
    // navegador sem suporte) nunca deve quebrar o formulário.
  }
}

export async function carregarRascunhoOcorrencia<T>(): Promise<T | null> {
  if (!indexedDbDisponivel()) return null
  try {
    const banco = await abrirBanco()
    const valor = await new Promise<T | null>((resolve, reject) => {
      const transacao = banco.transaction(NOME_STORE, 'readonly')
      const requisicao = transacao.objectStore(NOME_STORE).get(CHAVE_RASCUNHO)
      requisicao.onsuccess = () => resolve((requisicao.result as T | undefined) ?? null)
      requisicao.onerror = () => reject(requisicao.error)
    })
    banco.close()
    return valor
  } catch {
    return null
  }
}

export async function removerRascunhoOcorrencia(): Promise<void> {
  if (!indexedDbDisponivel()) return
  try {
    const banco = await abrirBanco()
    await new Promise<void>((resolve, reject) => {
      const transacao = banco.transaction(NOME_STORE, 'readwrite')
      transacao.objectStore(NOME_STORE).delete(CHAVE_RASCUNHO)
      transacao.oncomplete = () => resolve()
      transacao.onerror = () => reject(transacao.error)
    })
    banco.close()
  } catch {
    // idem: melhor esforço, não propaga erro.
  }
}

let timeoutAgendado: ReturnType<typeof setTimeout> | null = null

// Debounce: evita gravar no IndexedDB a cada tecla digitada/anexo adicionado.
export function agendarSalvarRascunhoOcorrencia<T>(valores: T): void {
  if (timeoutAgendado) clearTimeout(timeoutAgendado)
  timeoutAgendado = setTimeout(() => {
    timeoutAgendado = null
    void salvarRascunhoOcorrencia(valores)
  }, DEBOUNCE_MS)
}
