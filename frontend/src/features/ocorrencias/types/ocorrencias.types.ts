export type TipoOcorrencia = 'zoonose' | 'morcegos' | 'irregular' | 'agressivo' | 'outros'

export type StatusOcorrencia = 'ABERTA' | 'EM_ATENDIMENTO' | 'ENCERRADA'

export type ProvidenciaTomada =
  | 'orientacao_municipe'
  | 'encaminhamento_gepar'
  | 'abertura_processo'
  | 'captura_remocao'
  | 'sem_acao'
  | 'outro'
  | 'registro_indevido'

export type TipoMovimentacao =
  | 'REGISTRADA'
  | 'EQUIPE_DESPACHADA'
  | 'PROCESSO_VINCULADO'
  | 'AGUARDANDO_RESULTADO'
  | 'ENCERRADA'
  | 'NOTA_INTERNA'

export type StatusProcesso = 'ABERTO' | 'AGUARDANDO_RESULTADO' | 'COM_RESULTADO' | 'CONCLUIDO'

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
  statusAnterior: StatusOcorrencia | null
  statusNovo: StatusOcorrencia | null
  data: string
  descricao: string | null
  usuarioId: string
  usuarioNome: string
}

export interface AnexoOcorrencia {
  id: string
  nome: string
  mimeType: string
  tamanho: number
  criadoEm: string
}

export interface ProcessoVinculado {
  id: string
  protocolo: string
  statusProcesso: StatusProcesso
  urgente: boolean
}

export interface Ocorrencia {
  id: string
  protocolo: string
  tipoOcorrencia: TipoOcorrencia
  tipoOcorrenciaNome: string
  statusOcorrencia: StatusOcorrencia
  dataAbertura: string
  horaAbertura: string | null
  endereco: string
  bairro: string
  pontoReferencia: string | null
  descricao: string
  urgente: boolean
  sigilosa: boolean
  anonima: boolean
  latitude: number | null
  longitude: number | null
  registradoPorId: string
  registradoPorNome: string
  providenciaTomada: ProvidenciaTomada | null
  providenciaTomadaNome: string | null
  descricaoEncerramento: string | null
  encerradaEm: string | null
  encerradaPorNome: string | null
  processoVinculado: ProcessoVinculado | null
  denunciante: Denunciante | null
  denunciado: Denunciado | null
  movimentacoes: MovimentacaoOcorrencia[]
  anexos: AnexoOcorrencia[]
  podeVerDenunciante: boolean
  criadoEm: string
  atualizadoEm: string
}

export interface OcorrenciaResumo {
  id: string
  protocolo: string
  tipoOcorrencia: TipoOcorrencia
  tipoOcorrenciaNome: string
  statusOcorrencia: StatusOcorrencia
  dataAbertura: string
  bairro: string
  urgente: boolean
  sigilosa: boolean
  anonima: boolean
  denuncianteNome: string | null
  processoProtocolo: string | null
  podeVerDenunciante: boolean
}

export interface OcorrenciasFiltro {
  tipo?: TipoOcorrencia
  status?: StatusOcorrencia | StatusOcorrencia[]
  q?: string
  de?: string
  ate?: string
  pagina: number
  tamanho: number
}

export interface DenuncianteRequest {
  nome?: string
  cpf?: string
  telefone?: string
  email?: string
  cep?: string
  endereco?: string
  bairroResidencial?: string
}

export interface DenunciadoRequest {
  nome?: string
  cpf?: string
  telefone?: string
  endereco?: string
  observacoes?: string
}

export interface CriarOcorrenciaRequest {
  tipoOcorrencia: TipoOcorrencia
  dataAbertura: string
  horaAbertura?: string
  endereco: string
  bairro: string
  pontoReferencia?: string
  descricao: string
  urgente: boolean
  sigilosa: boolean
  anonima: boolean
  denunciante?: DenuncianteRequest
  denunciado?: DenunciadoRequest
}

export interface AtualizarOcorrenciaRequest {
  tipoOcorrencia: TipoOcorrencia
  dataAbertura: string
  horaAbertura?: string
  endereco: string
  bairro: string
  pontoReferencia?: string
  descricao: string
  urgente: boolean
  sigilosa: boolean
  anonima: boolean
  denunciante?: DenuncianteRequest
  denunciado?: DenunciadoRequest
}

export interface EncerrarOcorrenciaRequest {
  providenciaTomada: ProvidenciaTomada
  descricaoEncerramento?: string
}

export interface CatalogoItem {
  codigo: string
  nome: string
}

export interface CatalogosOcorrencia {
  tiposOcorrencia: CatalogoItem[]
  providencias: CatalogoItem[]
}

export interface ProcessoSanitario {
  id: string
  protocolo: string
  dataAbertura: string
  ocorrenciaId: string | null
  urgente: boolean
  statusProcesso: StatusProcesso
  criadoEm: string
}

export interface QuantidadePorBairro {
  bairro: string
  quantidade: number
}
