// Rascunho local do formulário de ocorrência em IndexedDB nativo (banco
// compartilhado com os outros rascunhos, lib/rascunhoDb.ts) — exigência de
// negócio para formulários longos ("cadastro de ocorrência"), já que a rede
// do CCZ é instável. Uma chave por formulário: 'novo' no cadastro e
// 'editar:<id>' na edição (mesmo padrão de rascunhoAnimalStorage.ts).
import { carregarRascunho, removerRascunho, salvarRascunho } from '@/lib/rascunhoDb'

const STORE = 'ocorrencias'
const DEBOUNCE_MS = 800
const CHAVE_CADASTRO = 'novo'
const CHAVE_ANEXOS_PENDENTES = 'anexos-pendentes'

export function chaveRascunhoOcorrencia(id: string | undefined): string {
  return id ? `editar:${id}` : CHAVE_CADASTRO
}

export function salvarRascunhoOcorrencia<T>(valores: T, chave: string = CHAVE_CADASTRO): Promise<void> {
  return salvarRascunho(STORE, chave, valores)
}

export function carregarRascunhoOcorrencia<T>(chave: string = CHAVE_CADASTRO): Promise<T | null> {
  return carregarRascunho<T>(STORE, chave)
}

export function removerRascunhoOcorrencia(chave: string = CHAVE_CADASTRO): Promise<void> {
  return removerRascunho(STORE, chave)
}

let timeoutAgendado: ReturnType<typeof setTimeout> | null = null

// Debounce: evita gravar no IndexedDB a cada tecla digitada/anexo adicionado.
export function agendarSalvarRascunhoOcorrencia<T>(valores: T, chave: string = CHAVE_CADASTRO): void {
  cancelarRascunhoAgendadoOcorrencia()
  timeoutAgendado = setTimeout(() => {
    timeoutAgendado = null
    void salvarRascunhoOcorrencia(valores, chave)
  }, DEBOUNCE_MS)
}

// Depois que a ocorrência é criada/salva no backend, um salvamento ainda
// agendado recriaria o rascunho — e o usuário poderia registrar a mesma
// ocorrência de novo ao restaurá-lo.
export function cancelarRascunhoAgendadoOcorrencia(): void {
  if (timeoutAgendado) clearTimeout(timeoutAgendado)
  timeoutAgendado = null
}

// D15: a ocorrência já foi criada (POST ok) e estes anexos ainda não subiram.
// Guarda só o id, o protocolo (para o aviso) e os arquivos — nunca dados do
// denunciante; vale também para ocorrência sigilosa (decisão rev. 12, item 3).
export interface AnexosPendentesOcorrencia {
  ocorrenciaId: string
  protocolo: string
  anexos: File[]
}

export function salvarAnexosPendentes(pendencia: AnexosPendentesOcorrencia): Promise<void> {
  return salvarRascunho(STORE, CHAVE_ANEXOS_PENDENTES, pendencia)
}

export function carregarAnexosPendentes(): Promise<AnexosPendentesOcorrencia | null> {
  return carregarRascunho<AnexosPendentesOcorrencia>(STORE, CHAVE_ANEXOS_PENDENTES)
}

export function removerAnexosPendentes(): Promise<void> {
  return removerRascunho(STORE, CHAVE_ANEXOS_PENDENTES)
}
