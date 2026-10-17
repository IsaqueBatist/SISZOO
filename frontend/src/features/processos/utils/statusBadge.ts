import type { StatusProcesso } from '../types/processos.types'

export interface Badge {
  classe: string
  label: string
}

const STATUS_PROCESSO_BADGE_MAP: Record<StatusProcesso, Badge> = {
  ABERTO: { classe: 'badge-process-open', label: 'Aberto' },
  AGUARDANDO_RESULTADO: { classe: 'badge-process-awaiting', label: 'Aguardando resultado' },
  COM_RESULTADO: { classe: 'badge-process-result', label: 'Com resultado' },
  CONCLUIDO: { classe: 'badge-process-closed', label: 'Concluído' },
}

export function badgeDeStatusProcesso(status: StatusProcesso): Badge {
  return STATUS_PROCESSO_BADGE_MAP[status] ?? { classe: 'badge-neutral', label: status }
}

// Slug da classe CSS `.badge-disease.<slug>` (components.css) pelo código do
// catálogo `doenca`; diverge do código em três casos. Código sem slug fica
// com o estilo base do badge.
const DOENCA_CLASSE_MAP: Record<string, string> = {
  raiva: 'raiva',
  esporotricose: 'esporotricose',
  leishmaniose_visceral: 'leishmaniose',
  leptospirose: 'leptospirose',
  febre_maculosa: 'febre-maculosa',
  febre_amarela: 'febre-amarela',
}

export function classeDeDoenca(codigo: string): string {
  return DOENCA_CLASSE_MAP[codigo] ?? ''
}
