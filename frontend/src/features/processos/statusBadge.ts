import type { Doenca, ResultadoLaboratorial, StatusProcesso } from './processos.types'

export interface Badge {
  classe: string
  label: string
}

const STATUS_PROCESSO_BADGE_MAP: Record<StatusProcesso, Badge> = {
  aberto: { classe: 'badge-process-open', label: 'Aberto' },
  aguardando_resultado: { classe: 'badge-process-awaiting', label: 'Aguardando resultado' },
  com_resultado: { classe: 'badge-process-result', label: 'Com resultado' },
  concluido: { classe: 'badge-process-closed', label: 'Concluído' },
}

export function badgeDeStatusProcesso(status: StatusProcesso): Badge {
  return STATUS_PROCESSO_BADGE_MAP[status] ?? { classe: 'badge-neutral', label: status }
}

// Slug da classe CSS `.badge-disease.<slug>` (components.css) — diverge do valor do enum em
// dois casos (leishmaniose_visceral→leishmaniose, febre_maculosa/febre_amarela com hífen).
const DOENCA_CLASSE_MAP: Record<Doenca, string> = {
  raiva: 'raiva',
  esporotricose: 'esporotricose',
  leishmaniose_visceral: 'leishmaniose',
  leptospirose: 'leptospirose',
  febre_maculosa: 'febre-maculosa',
  febre_amarela: 'febre-amarela',
}

export function classeDeDoenca(doenca: Doenca): string {
  return DOENCA_CLASSE_MAP[doenca] ?? ''
}

const RESULTADO_BADGE_MAP: Record<ResultadoLaboratorial, Badge> = {
  aguardando: { classe: 'badge-awaiting', label: 'Aguardando' },
  positivo: { classe: 'badge-positive', label: 'Positivo' },
  negativo: { classe: 'badge-negative', label: 'Negativo' },
  inconclusivo: { classe: 'badge-inconclusive', label: 'Inconclusivo' },
  material_inadequado: { classe: 'badge-neutral', label: 'Material inadequado' },
  nao_realizado: { classe: 'badge-neutral', label: 'Não realizado' },
}

export function badgeDeResultado(resultado: ResultadoLaboratorial): Badge {
  return RESULTADO_BADGE_MAP[resultado] ?? { classe: 'badge-neutral', label: resultado }
}
