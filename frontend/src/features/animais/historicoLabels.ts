import type { StatusPrescricao, UnidadeDose, UnidadeFrequencia, ViaAdministracao } from './historico.types'

export const LABELS_UNIDADE_DOSE: Record<UnidadeDose, string> = {
  MILIGRAMA: 'mg',
  MICROGRAMA: 'mcg',
  GRAMA: 'g',
  MILILITRO: 'mL',
  UNIDADE_INTERNACIONAL: 'UI',
}

export const LABELS_UNIDADE_FREQUENCIA: Record<UnidadeFrequencia, string> = {
  HORAS: 'horas',
  DIAS: 'dias',
}

export const LABELS_VIA_ADMINISTRACAO: Record<ViaAdministracao, string> = {
  ORAL: 'Oral',
  INTRAVENOSA: 'Intravenosa',
  INTRAMUSCULAR: 'Intramuscular',
  SUBCUTANEA: 'Subcutânea',
  TOPICA: 'Tópica',
}

export const LABELS_STATUS_PRESCRICAO: Record<StatusPrescricao, string> = {
  ATIVA: 'Ativa',
  CONCLUIDA: 'Concluída',
  SUSPENSA: 'Suspensa',
  CANCELADA: 'Cancelada',
}
