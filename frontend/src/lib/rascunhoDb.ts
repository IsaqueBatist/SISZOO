// Banco IndexedDB único dos rascunhos de formulário (rede do CCZ é instável:
// formulário longo não pode perder dados numa queda de conexão).
//
// Por que um módulo só: animais, ocorrências e processos abriam o mesmo banco
// 'siszoo-rascunhos' na versão 1, cada um criando a PRÓPRIA store no upgrade.
// Esse evento só dispara quando a versão sobe — então, no navegador real, só a
// store do primeiro formulário aberto existia e os outros rascunhos falhavam
// em silêncio. O upgrade cria todas as stores que faltam de uma vez e nunca
// apaga as existentes; para incluir uma store nova, acrescente o nome em
// STORES_RASCUNHO e suba VERSAO_BANCO.
// Versão 3: store 'clinico' (modais de vacina, procedimento, prescrição e de
// baia). Versão 4 (T42): store 'arquivos', um registro por arquivo anexado,
// com o Blob gravado direto — nunca base64. Quem vem de uma versão anterior
// mantém todos os rascunhos que já tinha.
import { openDB, type DBSchema, type IDBPDatabase } from 'idb'

const NOME_BANCO = 'siszoo-rascunhos'
const VERSAO_BANCO = 4

// Stores de rascunho de TEXTO: uma por formulário/família de formulários.
const STORES_TEXTO = ['animais', 'ocorrencias', 'processos', 'clinico'] as const
export type StoreRascunho = (typeof STORES_TEXTO)[number]

// Store dos arquivos anexados aos rascunhos (T42). Separada das de texto
// porque o ciclo de vida é por arquivo, não por formulário.
export const STORE_ARQUIVOS = 'arquivos'

export const STORES_RASCUNHO = [...STORES_TEXTO, STORE_ARQUIVOS] as const

// T42: rascunho esquecido não fica indefinidamente no disco de uma máquina
// compartilhada. Para mudar o prazo, altere SÓ esta constante.
export const VALIDADE_RASCUNHO_MS = 7 * 24 * 60 * 60 * 1000

// O que fica gravado numa store de texto: os valores do formulário mais o
// instante do salvamento, que alimenta o aviso de restauração e a expiração.
export interface RegistroRascunho<T> {
  dados: T
  // null = rascunho gravado antes da T42, sem instante registrado. Continua
  // restaurável (só sem data na tela) e não é tratado como expirado; na
  // primeira regravação ele passa a ter instante como qualquer outro.
  salvoEm: number | null
}

// O que o rascunho de TEXTO guarda por arquivo anexado: nunca o conteúdo.
export interface ReferenciaArquivoRascunho {
  id: string
  nome: string
  tamanho: number
  tipo: string
}

// Rascunho a que um arquivo pertence, para apagar em bloco e para a varredura
// de órfãos — sem precisar decifrar a chave.
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

// Todas as chaves levam o id do usuário logado na frente ('<usuarioId>:novo'):
// o banco é do navegador, não da sessão, e um computador do CCZ é usado por
// várias pessoas. Rascunhos antigos sem esse prefixo ficam inalcançáveis (não
// são migrados) e somem no próximo logout (limparRascunhos).
export function chaveComEscopo(usuarioId: string, chave: string): string {
  return `${usuarioId}:${chave}`
}

// Uma conexão só, reaproveitada por todas as operações.
//
// Por que não abrir e fechar a cada operação, como a versão anterior fazia: a
// idb cria a promessa `done` de TODA transação que embrulha, inclusive as de
// leitura (cacheDonePromiseForTransaction), e essa promessa rejeita se a
// transação abortar. Numa leitura, o `await` do get resolve quando a
// REQUISIÇÃO termina, não quando a transação fecha — então um close() logo
// depois abortava uma transação ainda em curso, e a rejeição do `done`, que
// ninguém espera em leitura, virava erro não tratado. Só aparecia sob disputa
// de CPU, que é o caso do CI: a suíte passava inteira e o processo saía com 1.
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
    // Outra aba quer subir a versão do banco: esta conexão sai da frente.
    blocking(_atual, _nova, evento) {
      ;(evento.target as IDBDatabase | null)?.close()
      bancoAberto = null
    },
    // O navegador encerrou a conexão por conta própria.
    terminated() {
      bancoAberto = null
    },
  }).catch((erro: unknown) => {
    // Sem isto, uma falha de abertura (modo privado, por exemplo) ficaria em
    // cache e nenhuma tentativa posterior funcionaria.
    bancoAberto = null
    throw erro
  })
  return bancoAberto
}

// Descarta a conexão em cache sem fechá-la. Existe para os testes, em que cada
// um instala uma fábrica de IndexedDB nova e a conexão guardada apontaria para
// o banco do teste anterior. Não fecha de propósito: fechar é exatamente o que
// abortava transação em curso.
export function esquecerBancoRascunhos(): void {
  bancoAberto = null
}

// Rascunho é melhor esforço: falha de IndexedDB (modo privado, quota,
// navegador sem suporte) nunca deve quebrar o formulário — por isso todas as
// operações engolem o erro. A exceção é salvarArquivoRascunho, que precisa
// avisar a tela quando o arquivo não couber.
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

// Um registro gravado antes da T42 não tem `salvoEm` e vem como os próprios
// valores do formulário; o envelope é reconhecido por esse campo.
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
    // Vencido não é oferecido e sai do disco na mesma leitura.
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

// Cancela todos os salvamentos pendentes. Usado pelo logout e pelo teardown
// dos testes: um salvamento agendado que sobrevive ao fim de um teste dispara
// durante a limpeza do ambiente e tenta abrir um banco que já está sendo
// descartado, o que aborta a transação e vira erro não tratado na suíte.
export function cancelarTodosOsSalvamentosAgendados(): void {
  for (const agendado of salvamentosAgendados.values()) clearTimeout(agendado)
  salvamentosAgendados.clear()
}

// Logout manual: apaga rascunhos, arquivos e anexos pendentes de TODOS os
// usuários deste navegador (inclusive chaves antigas sem escopo) e cancela os
// salvamentos ainda agendados, que recriariam o rascunho logo depois.
export async function limparRascunhos(): Promise<void> {
  cancelarTodosOsSalvamentosAgendados()
  await comBanco(async (banco) => {
    const transacao = banco.transaction([...STORES_RASCUNHO], 'readwrite')
    // allSettled e o catch no `done`, não Promise.all: com o all, a primeira
    // rejeição abandona as outras promessas, que rejeitam depois sem ninguém
    // escutando — e uma transação abortada viraria erro não tratado.
    await Promise.allSettled(STORES_RASCUNHO.map((store) => transacao.objectStore(store).clear()))
    await transacao.done.catch(() => undefined)
  }, undefined)
}

// ---------------------------------------------------------------------------
// Arquivos anexados ao rascunho (T42)
// ---------------------------------------------------------------------------

function chaveArquivo(usuarioId: string, id: string): string {
  return chaveComEscopo(usuarioId, `arquivo:${id}`)
}

// Grava o arquivo UMA vez, no momento em que ele é anexado — fora do debounce
// do rascunho de texto, que continua guardando só a referência devolvida aqui.
// Devolve null quando não foi possível gravar (cota, modo privado, navegador
// sem IndexedDB): quem chama avisa a tela, e o arquivo segue no formulário em
// memória.
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

// Todos os arquivos de um rascunho: usado no envio com sucesso, no descarte e
// ao marcar a ocorrência como sigilosa.
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

// Varredura de manutenção, disparada uma vez ao abrir o sistema: apaga
// rascunhos e arquivos vencidos e também arquivos órfãos — aqueles cujo
// rascunho não existe mais, o que acontece se o navegador cair entre a
// gravação do arquivo e a do rascunho de texto.
export async function limparRascunhosExpirados(): Promise<void> {
  await comBanco(async (banco) => {
    // Uma transação explícita com o `done` escutado desde a criação (mesmo
    // motivo de limparRascunhos): os atalhos banco.get/delete abriam uma
    // transação por chamada, e a de uma varredura interrompida (aba fechada,
    // ambiente de teste desmontado no meio) rejeitava sem ninguém escutando.
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

// Operações de rascunho de uma store, no formato que o hook useRascunho
// consome. O debounce do salvamento automático fica no agendamento acima.
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
