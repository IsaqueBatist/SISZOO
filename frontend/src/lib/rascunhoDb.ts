// Banco IndexedDB único dos rascunhos de formulário (rede do CCZ é instável:
// formulário longo não pode perder dados numa queda de conexão).
//
// Por que um módulo só: animais, ocorrências e processos abriam o mesmo banco
// 'siszoo-rascunhos' na versão 1, cada um criando a PRÓPRIA store no
// onupgradeneeded. Esse evento só dispara quando a versão sobe — então, no
// navegador real, só a store do primeiro formulário aberto existia e os
// outros rascunhos falhavam em silêncio. O upgrade cria todas as stores que
// faltam de uma vez e nunca apaga as existentes; para incluir uma store nova,
// acrescente o nome em STORES_RASCUNHO e suba VERSAO_BANCO.
// Versão 3: store 'clinico' (modais de vacina, procedimento, prescrição e de
// baia). Quem vem da 2 mantém os rascunhos de animais, ocorrências e processos.
const NOME_BANCO = 'siszoo-rascunhos'
const VERSAO_BANCO = 3

export const STORES_RASCUNHO = ['animais', 'ocorrencias', 'processos', 'clinico'] as const
export type StoreRascunho = (typeof STORES_RASCUNHO)[number]

function indexedDbDisponivel(): boolean {
  return typeof indexedDB !== 'undefined'
}

// Todas as chaves levam o id do usuário logado na frente ('<usuarioId>:novo'):
// o banco é do navegador, não da sessão, e um computador do CCZ é usado por
// várias pessoas. Rascunhos antigos sem esse prefixo ficam inalcançáveis (não
// são migrados) e somem no próximo logout (limparRascunhos).
export function chaveComEscopo(usuarioId: string, chave: string): string {
  return `${usuarioId}:${chave}`
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
// navegador sem suporte) nunca deve quebrar o formulário — por isso todas as
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

const salvamentosAgendados = new Map<string, ReturnType<typeof setTimeout>>()

function idAgendamento(store: StoreRascunho, chave: string): string {
  return `${store}|${chave}`
}

// Debounce por store+chave: evita gravar no IndexedDB a cada tecla digitada.
// Fica aqui (e não em cada feature) para que o logout cancele tudo de uma vez.
export function agendarSalvarRascunho<T>(store: StoreRascunho, chave: string, valores: T, atrasoMs: number): void {
  cancelarSalvamentoAgendado(store, chave)
  const id = idAgendamento(store, chave)
  salvamentosAgendados.set(
    id,
    setTimeout(() => {
      salvamentosAgendados.delete(id)
      void salvarRascunho(store, chave, valores)
    }, atrasoMs),
  )
}

export function cancelarSalvamentoAgendado(store: StoreRascunho, chave: string): void {
  const id = idAgendamento(store, chave)
  const agendado = salvamentosAgendados.get(id)
  if (agendado) clearTimeout(agendado)
  salvamentosAgendados.delete(id)
}

// Logout manual: apaga rascunhos e anexos pendentes de TODOS os usuários
// deste navegador (inclusive chaves antigas sem escopo) e cancela os
// salvamentos ainda agendados, que recriariam o rascunho logo depois.
export async function limparRascunhos(): Promise<void> {
  for (const agendado of salvamentosAgendados.values()) clearTimeout(agendado)
  salvamentosAgendados.clear()
  if (!indexedDbDisponivel()) return
  try {
    const banco = await abrirBancoRascunhos()
    await new Promise<void>((resolve, reject) => {
      const transacao = banco.transaction([...STORES_RASCUNHO], 'readwrite')
      for (const store of STORES_RASCUNHO) transacao.objectStore(store).clear()
      transacao.oncomplete = () => resolve()
      transacao.onerror = () => reject(transacao.error)
    })
    banco.close()
  } catch {
    // idem
  }
}

// Operações de rascunho de uma store, no formato que o hook useRascunho
// consome. O debounce do salvamento automático fica no agendamento acima.
export interface ArmazenamentoRascunho<T> {
  carregar(chave: string): Promise<T | null>
  agendarSalvar(chave: string, valores: T): void
  salvar(chave: string, valores: T): Promise<void>
  remover(chave: string): Promise<void>
  cancelarAgendado?(chave: string): void
}

export function armazenamentoRascunho<T>(store: StoreRascunho, debounceMs: number): ArmazenamentoRascunho<T> {
  return {
    carregar: (chave) => carregarRascunho<T>(store, chave),
    agendarSalvar: (chave, valores) => agendarSalvarRascunho(store, chave, valores, debounceMs),
    salvar: (chave, valores) => salvarRascunho(store, chave, valores),
    remover: (chave) => removerRascunho(store, chave),
    cancelarAgendado: (chave) => cancelarSalvamentoAgendado(store, chave),
  }
}
