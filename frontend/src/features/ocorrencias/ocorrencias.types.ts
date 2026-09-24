// PROVISÓRIO: não existe com.siszoo.ocorrencias.dto.OcorrenciaResponse no
// backend ainda (módulo `ocorrencias` só tem pastas .gitkeep — ver plano da
// T28). Tipos modelados a partir de docs/DER.md §3.4 (Ocorrências) até o
// contrato real existir; revalidar campo a campo quando o backend nascer.

export type TipoOcorrencia = 'zoonose' | 'morcegos' | 'irregular' | 'agressivo' | 'outros'

export type StatusOcorrencia = 'aberta' | 'em_atendimento' | 'encerrada'

export type ProvidenciaTomada =
  | 'orientacao_municipe'
  | 'encaminhamento_gepar'
  | 'abertura_processo'
  | 'captura_remocao'
  | 'sem_acao'
  | 'outro'

export type TipoMovimentacao =
  | 'registrada'
  | 'equipe_despachada'
  | 'processo_vinculado'
  | 'aguardando_resultado'
  | 'encerrada'
  | 'nota_interna'

// Campos pessoais vêm `null` quando `ocorrencia.sigilosa = true` e o perfil
// autenticado não é admin (DER.md §3.4, regra da tabela `denunciante`) — o
// mascaramento é decidido inteiramente pelo backend, nunca pelo frontend.
export interface Denunciante {
  nome: string | null
  cpf: string | null
  telefone: string | null
  email: string | null
  cep: string | null
  endereco: string | null
  bairroResidencial: string | null
}

export interface Denunciado {
  nome: string | null
  cpf: string | null
  telefone: string | null
  endereco: string | null
  observacoes: string | null
}

export interface MovimentacaoOcorrencia {
  id: string
  tipoMovimentacao: TipoMovimentacao
  data: string
  descricao: string | null
  // PROVISÓRIO (enriquecimento id→nome, sem confirmação contra DTO real —
  // precedente: Animal.criadoPorNome em animais.types.ts). DER.md só lista
  // `usuario_id` (FK crua). Pode vir "Sistema" para movimentações automáticas.
  usuarioNome: string
}

export interface AnexoOcorrencia {
  id: string
  nome: string
  url: string
  tamanho: number
  mimeType: string
  criadoEm: string
}

// PROVISÓRIO: o módulo `processos` também não tem nenhum código (só
// .gitkeep). Campo baseado na FK `ocorrencia.processo_sanitario_id` do
// DER.md (§3.4) e criado só para viabilizar a regra 13 (bloqueio de
// encerramento com processo pendente de resultado) — revalidar contra o DTO
// real de processo sanitário quando esse módulo existir.
export interface ProcessoVinculado {
  id: string
  protocolo: string
  statusProcesso: string
  resultadoPendente: boolean
}

export interface Ocorrencia {
  id: string
  protocolo: string
  tipoOcorrencia: TipoOcorrencia
  statusOcorrencia: StatusOcorrencia
  dataAbertura: string
  horaAbertura: string | null
  endereco: string
  bairro: string
  pontoReferencia: string | null
  descricao: string
  urgente: boolean
  sigilosa: boolean
  // PROVISÓRIO (enriquecimento id→nome — ver MovimentacaoOcorrencia.usuarioNome).
  registradoPorNome: string
  providenciaTomada: ProvidenciaTomada | null
  descricaoEncerramento: string | null
  encerradaEm: string | null
  processoVinculado: ProcessoVinculado | null
  denunciante: Denunciante | null
  denunciado: Denunciado | null
  movimentacoes: MovimentacaoOcorrencia[]
  anexos: AnexoOcorrencia[]
  criadoEm: string
  atualizadoEm: string
}

export interface EncerrarOcorrenciaRequest {
  providenciaTomada: ProvidenciaTomada
  descricaoEncerramento?: string
}
