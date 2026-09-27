// Rascunho local do wizard de processo sanitário em IndexedDB nativo (mesma
// infraestrutura de rascunhoAnimalStorage.ts / rascunhoOcorrenciaStorage.ts,
// store próprio) — exigência de negócio para formulários longos ("wizard de
// processo", frontend/CLAUDE.md), já que a rede do CCZ é instável. T32 não
// inclui edição de processo existente, então há uma única chave fixa
// ('novo'), igual ao rascunho de ocorrência.
//
// O objeto salvo também guarda `etapaAtual` e `ocorrenciaId`/`vinculoDecisao`
// (via RascunhoProcesso<T>) para que o rascunho restaurado reabra na etapa
// certa e com o vínculo da RN2 respeitado — não é só o formulário puro.
const NOME_BANCO = 'siszoo-rascunhos'
const NOME_STORE = 'processos'
const VERSAO_BANCO = 1
const DEBOUNCE_MS = 800
const CHAVE_RASCUNHO = 'novo'

export interface RascunhoProcesso<T> {
  etapaAtual: 1 | 2 | 3 | 4
  valores: T
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

export async function salvarRascunhoProcesso<T>(valores: RascunhoProcesso<T>): Promise<void> {
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

export async function carregarRascunhoProcesso<T>(): Promise<RascunhoProcesso<T> | null> {
  if (!indexedDbDisponivel()) return null
  try {
    const banco = await abrirBanco()
    const valor = await new Promise<RascunhoProcesso<T> | null>((resolve, reject) => {
      const transacao = banco.transaction(NOME_STORE, 'readonly')
      const requisicao = transacao.objectStore(NOME_STORE).get(CHAVE_RASCUNHO)
      requisicao.onsuccess = () => resolve((requisicao.result as RascunhoProcesso<T> | undefined) ?? null)
      requisicao.onerror = () => reject(requisicao.error)
    })
    banco.close()
    return valor
  } catch {
    return null
  }
}

export async function removerRascunhoProcesso(): Promise<void> {
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

// Debounce: evita gravar no IndexedDB a cada tecla digitada. Além disso,
// ProcessoForm.tsx chama `salvarRascunhoProcesso` diretamente (sem debounce)
// a cada troca de etapa, conforme exigido pela tarefa.
export function agendarSalvarRascunhoProcesso<T>(valores: RascunhoProcesso<T>): void {
  if (timeoutAgendado) clearTimeout(timeoutAgendado)
  timeoutAgendado = setTimeout(() => {
    timeoutAgendado = null
    void salvarRascunhoProcesso(valores)
  }, DEBOUNCE_MS)
}
