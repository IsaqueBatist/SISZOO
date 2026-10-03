// Espelha os records de com.siszoo.animais.clinico.dto/entity do backend
// (Vacinacao, Procedimento, Prescricao, Medicamento — módulo "clinico").

export type UnidadeDose = 'MILIGRAMA' | 'MICROGRAMA' | 'GRAMA' | 'MILILITRO' | 'UNIDADE_INTERNACIONAL'
export type UnidadeFrequencia = 'HORAS' | 'DIAS'
export type ViaAdministracao = 'ORAL' | 'INTRAVENOSA' | 'INTRAMUSCULAR' | 'SUBCUTANEA' | 'TOPICA'
export type StatusPrescricao = 'ATIVA' | 'CONCLUIDA' | 'SUSPENSA' | 'CANCELADA'

// "ATIVO" | "RETIFICADO" — calculado no mapper do backend a partir de
// `retificadoPorId`, nunca persistido.
export type StatusRegistroClinico = 'ATIVO' | 'RETIFICADO'

// Espelha com.siszoo.animais.clinico.dto.VacinacaoResponse.
export interface Vacinacao {
  id: string
  animalId: string
  vacinaCodigo: string
  vacinaNome: string
  aplicadoPorId: string | null
  aplicadoPorNome: string | null
  dataAplicacao: string
  dataValidade: string | null
  numeroDose: number | null
  doseQuantidade: number
  doseUnidade: UnidadeDose | null
  lote: string | null
  observacoes: string | null
  retificaId: string | null
  retificadoPorId: string | null
  statusRegistro: StatusRegistroClinico
  criadoEm: string
}

// Espelha com.siszoo.animais.clinico.dto.CriarVacinacaoRequest.
export interface CriarVacinacaoRequest {
  animalId: string
  vacina: string
  dataAplicacao: string
  numeroDose?: number
  doseQuantidade: number
  doseUnidade?: UnidadeDose
  lote?: string
  observacoes?: string
  retificaId?: string
}

// Espelha com.siszoo.animais.clinico.dto.ProcedimentoResponse.
export interface Procedimento {
  id: string
  animalId: string
  tipoProcedimentoCodigo: string
  tipoProcedimentoNome: string
  executadoPorId: string | null
  executadoPorNome: string | null
  data: string
  descricao: string | null
  resultado: string | null
  retificaId: string | null
  retificadoPorId: string | null
  statusRegistro: StatusRegistroClinico
  criadoEm: string
}

// Espelha com.siszoo.animais.clinico.dto.CriarProcedimentoRequest.
export interface CriarProcedimentoRequest {
  animalId: string
  tipoProcedimento: string
  data: string
  descricao?: string
  resultado?: string
  retificaId?: string
}

// Espelha com.siszoo.animais.clinico.dto.PrescricaoResponse.
export interface Prescricao {
  id: string
  animalId: string
  medicamentoId: string
  medicamentoNome: string
  prescritoPorId: string | null
  prescritoPorNome: string | null
  dataInicio: string
  dataFimPrevista: string | null
  dataFimReal: string | null
  frequenciaAplicada: number
  unidadeFrequencia: UnidadeFrequencia
  doseQuantidade: number
  doseUnidade: UnidadeDose
  viaAdministracao: ViaAdministracao
  status: StatusPrescricao
  retificaId: string | null
  retificadoPorId: string | null
  statusRegistro: StatusRegistroClinico
  criadoEm: string
}

// Espelha com.siszoo.animais.clinico.dto.CriarPrescricaoRequest.
export interface CriarPrescricaoRequest {
  animalId: string
  medicamentoId: string
  dataInicio: string
  dataFimPrevista?: string
  dataFimReal?: string
  frequenciaAplicada: number
  unidadeFrequencia: UnidadeFrequencia
  doseQuantidade: number
  doseUnidade: UnidadeDose
  viaAdministracao: ViaAdministracao
  status: StatusPrescricao
  retificaId?: string
}

// Espelha com.siszoo.animais.clinico.dto.MedicamentoResponse (catálogo —
// tem GET próprio, ao contrário de Vacina/TipoProcedimento).
export interface Medicamento {
  id: string
  nome: string
  categoriaId: string
  categoriaNome: string
  ativo: boolean
}
