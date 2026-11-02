import { openDB, type DBSchema, type IDBPDatabase } from 'idb'

const NOME_BANCO = 'siszoo-rascunhos'
const VERSAO_BANCO = 4

const STORES_TEXTO = ['animais', 'ocorrencias', 'processos', 'clinico'] as const
export type StoreRascunho = (typeof STORES_TEXTO)[number]

export const STORE_ARQUIVOS = 'arquivos'

export const STORES_RASCUNHO = [...STORES_TEXTO, STORE_ARQUIVOS] as const

export const VALIDADE_RASCUNHO_MS = 7 * 24 * 60 * 60 * 1000

export interface RegistroRascunho<T> {
  dados: T
  salvoEm: number | null
}

export interface ReferenciaArquivoRascunho {
  id: string
  nome: string
  tamanho: number
  tipo: string
}

export interface DonoArquivoRascunho {
  store: StoreRascunho
  chave: string
}

interface ArquivoRascunho {
  dados: Blob
  salvoEm: number
  dono: DonoArquivoRascunho
}

interface SchemaRascunhos extends DBSchema {
  animais: { key: string; value: unknown }
  ocorrencias: { key: string; value: unknown }
  processos: { key: string; value: unknown }
  clinico: { key: string; value: unknown }
  arquivos: { key: string; value: ArquivoRascunho }
}

function indexedDbDisponivel(): boolean {
  return typeof indexedDB !== 'undefined'
}

export function chaveComEscopo(usuarioId: string, chave: string): string {
  return `${usuarioId}:${chave}`
}

let bancoAberto: Promise<IDBPDatabase<SchemaRascunhos>> | null = null

export function abrirBancoRascunhos(): Promise<IDBPDatabase<SchemaRascunhos>> {
  bancoAberto ??= openDB<SchemaRascunhos>(NOME_BANCO, VERSAO_BANCO, {
    upgrade(banco) {
      for (const store of STORES_RASCUNHO) {
        if (!banco.objectStoreNames.contains(store)) {
          banco.createObjectStore(store)
        }
      }
    },
    blocking(_atual, _nova, evento) {
      ;(evento.target as IDBDatabase | null)?.close()
      bancoAberto = null
    },
    terminated() {
      bancoAberto = null
    },
  }).catch((erro: unknown) => {
    bancoAberto = null
    throw erro
  })
  return bancoAberto
}

export function esquecerBancoRascunhos(): void {
  bancoAberto = null
}

async function comBanco<T>(operacao: (banco: IDBPDatabase<SchemaRascunhos>) => Promise<T>, aoFalhar: T): Promise<T> {
  if (!indexedDbDisponivel()) return aoFalhar
  try {
    return await operacao(await abrirBancoRascunhos())
  } catch {
    return aoFalhar
  }
}

function expirou(salvoEm: number | null): boolean {
  if (salvoEm === null) return false
  return Date.now() - salvoEm > VALIDADE_RASCUNHO_MS
}

function desembrulhar<T>(bruto: unknown): RegistroRascunho<T> | null {
  if (bruto === null || bruto === undefined) return null
  if (typeof bruto === 'object' && 'salvoEm' in bruto && typeof (bruto as RegistroRascunho<T>).salvoEm === 'number') {
    const registro = bruto as RegistroRascunho<T>
    return { dados: registro.dados, salvoEm: registro.salvoEm }
  }
  return { dados: bruto as T, salvoEm: null }
}

export function salvarRascunho<T>(store: StoreRascunho, chave: string, valores: T): Promise<void> {
  return comBanco(async (banco) => {
    await banco.put(store, { dados: valores, salvoEm: Date.now() }, chave)
  }, undefined)
}

export function carregarRascunho<T>(store: StoreRascunho, chave: string): Promise<RegistroRascunho<T> | null> {
  return comBanco(async (banco) => {
    const registro = desembrulhar<T>(await banco.get(store, chave))
    if (!registro) return null
    if (expirou(registro.salvoEm)) {
      await banco.delete(store, chave)
      return null
    }
    return registro
  }, null)
}

export function removerRascunho(store: StoreRascunho, chave: string): Promise<void> {
  return comBanco(async (banco) => {
    await banco.delete(store, chave)
  }, undefined)
}

const salvamentosAgendados = new Map<string, ReturnType<typeof setTimeout>>()

function idAgendamento(store: StoreRascunho, chave: string): string {
  return `${store}|${chave}`
}

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

export function cancelarTodosOsSalvamentosAgendados(): void {
  for (const agendado of salvamentosAgendados.values()) clearTimeout(agendado)
  salvamentosAgendados.clear()
}

export async function limparRascunhos(): Promise<void> {
  cancelarTodosOsSalvamentosAgendados()
  await comBanco(async (banco) => {
    const transacao = banco.transaction([...STORES_RASCUNHO], 'readwrite')
    await Promise.allSettled(STORES_RASCUNHO.map((store) => transacao.objectStore(store).clear()))
    await transacao.done.catch(() => undefined)
  }, undefined)
}

function chaveArquivo(usuarioId: string, id: string): string {
  return chaveComEscopo(usuarioId, `arquivo:${id}`)
}

export async function salvarArquivoRascunho(
  usuarioId: string,
  dono: DonoArquivoRascunho,
  arquivo: File,
): Promise<ReferenciaArquivoRascunho | null> {
  if (!indexedDbDisponivel()) return null
  const id = crypto.randomUUID()
  try {
    const banco = await abrirBancoRascunhos()
    await banco.put(STORE_ARQUIVOS, { dados: arquivo, salvoEm: Date.now(), dono }, chaveArquivo(usuarioId, id))
  } catch {
    return null
  }
  return { id, nome: arquivo.name, tamanho: arquivo.size, tipo: arquivo.type }
}

export function carregarArquivoRascunho(usuarioId: string, id: string): Promise<Blob | null> {
  return comBanco(async (banco) => {
    const registro = await banco.get(STORE_ARQUIVOS, chaveArquivo(usuarioId, id))
    if (!registro) return null
    if (expirou(registro.salvoEm)) {
      await banco.delete(STORE_ARQUIVOS, chaveArquivo(usuarioId, id))
      return null
    }
    return registro.dados
  }, null)
}

export function removerArquivoRascunho(usuarioId: string, id: string): Promise<void> {
  return comBanco(async (banco) => {
    await banco.delete(STORE_ARQUIVOS, chaveArquivo(usuarioId, id))
  }, undefined)
}

export function removerArquivosDoRascunho(dono: DonoArquivoRascunho): Promise<void> {
  return comBanco(async (banco) => {
    for (const chave of await banco.getAllKeys(STORE_ARQUIVOS)) {
      const registro = await banco.get(STORE_ARQUIVOS, chave)
      if (registro && registro.dono.store === dono.store && registro.dono.chave === dono.chave) {
        await banco.delete(STORE_ARQUIVOS, chave)
      }
    }
  }, undefined)
}

export async function limparRascunhosExpirados(): Promise<void> {
  await comBanco(async (banco) => {
    const transacao = banco.transaction([...STORES_RASCUNHO], 'readwrite')
    const concluida = transacao.done.catch(() => undefined)
    const chavesVivas = new Map<StoreRascunho, Set<IDBValidKey>>()

    try {
      for (const store of STORES_TEXTO) {
        const vivas = new Set<IDBValidKey>()
        const objetos = transacao.objectStore(store)
        for (const chave of await objetos.getAllKeys()) {
          const registro = desembrulhar<unknown>(await objetos.get(chave))
          if (registro && expirou(registro.salvoEm)) {
            await objetos.delete(chave)
          } else if (registro) {
            vivas.add(chave)
          }
        }
        chavesVivas.set(store, vivas)
      }

      const arquivos = transacao.objectStore(STORE_ARQUIVOS)
      for (const chave of await arquivos.getAllKeys()) {
        const registro = await arquivos.get(chave)
        if (!registro) continue
        const orfao = !chavesVivas.get(registro.dono.store)?.has(registro.dono.chave)
        if (orfao || expirou(registro.salvoEm)) {
          await arquivos.delete(chave)
        }
      }
    } finally {
      await concluida
    }
  }, undefined)
}

export interface ArmazenamentoRascunho<T> {
  carregar(chave: string): Promise<RegistroRascunho<T> | null>
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
