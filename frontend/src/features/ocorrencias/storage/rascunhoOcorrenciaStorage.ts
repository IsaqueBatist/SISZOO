// Rascunho local do formulário de ocorrência em IndexedDB nativo (banco
// compartilhado com os outros rascunhos, lib/rascunhoDb.ts) — exigência de
// negócio para formulários longos ("cadastro de ocorrência"), já que a rede
// do CCZ é instável. Uma chave por usuário e formulário: '<usuarioId>:novo'
// no cadastro e '<usuarioId>:editar:<id>' na edição (mesmo padrão de
// rascunhoAnimalStorage.ts).
import {
  agendarSalvarRascunho,
  cancelarSalvamentoAgendado,
  carregarRascunho,
  chaveComEscopo,
  removerRascunho,
  salvarRascunho,
} from '@/lib/rascunhoDb'

const STORE = 'ocorrencias'
const DEBOUNCE_MS = 800

export function chaveRascunhoOcorrencia(usuarioId: string, id: string | undefined): string {
  return chaveComEscopo(usuarioId, id ? `editar:${id}` : 'novo')
}

export function salvarRascunhoOcorrencia<T>(valores: T, chave: string): Promise<void> {
  return salvarRascunho(STORE, chave, valores)
}

export function carregarRascunhoOcorrencia<T>(chave: string): Promise<T | null> {
  return carregarRascunho<T>(STORE, chave)
}

export function removerRascunhoOcorrencia(chave: string): Promise<void> {
  return removerRascunho(STORE, chave)
}

// Debounce: evita gravar no IndexedDB a cada tecla digitada/anexo adicionado.
export function agendarSalvarRascunhoOcorrencia<T>(valores: T, chave: string): void {
  agendarSalvarRascunho(STORE, chave, valores, DEBOUNCE_MS)
}

// Depois que a ocorrência é criada/salva no backend, um salvamento ainda
// agendado recriaria o rascunho — e o usuário poderia registrar a mesma
// ocorrência de novo ao restaurá-lo.
export function cancelarRascunhoAgendadoOcorrencia(chave: string): void {
  cancelarSalvamentoAgendado(STORE, chave)
}

// D15: a ocorrência já foi criada (POST ok) e estes anexos ainda não subiram.
// Guarda só o id, o protocolo (para o aviso) e os arquivos — nunca dados do
// denunciante; vale também para ocorrência sigilosa (decisão rev. 12, item 3).
// A chave é do usuário que registrou: a pendência de outro usuário do mesmo
// navegador não aparece nem bloqueia o "Registrar".
export interface AnexosPendentesOcorrencia {
  ocorrenciaId: string
  protocolo: string
  anexos: File[]
}

function chaveAnexosPendentes(usuarioId: string): string {
  return chaveComEscopo(usuarioId, 'anexos-pendentes')
}

export function salvarAnexosPendentes(usuarioId: string, pendencia: AnexosPendentesOcorrencia): Promise<void> {
  return salvarRascunho(STORE, chaveAnexosPendentes(usuarioId), pendencia)
}

export function carregarAnexosPendentes(usuarioId: string): Promise<AnexosPendentesOcorrencia | null> {
  return carregarRascunho<AnexosPendentesOcorrencia>(STORE, chaveAnexosPendentes(usuarioId))
}

export function removerAnexosPendentes(usuarioId: string): Promise<void> {
  return removerRascunho(STORE, chaveAnexosPendentes(usuarioId))
}
