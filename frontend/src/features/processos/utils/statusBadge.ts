import type { CatalogoItem, StatusProcesso } from '../types/processos.types'

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

// Badge do resultado laboratorial (T37), pelo codigo do catalogo
// (resultadosLaboratoriais de GET /processos/catalogos). "aguardando" so
// aparece aqui antes do lancamento (nunca e o valor gravado em si).
const RESULTADO_BADGE_MAP: Record<string, Badge> = {
  aguardando: { classe: 'badge-awaiting', label: 'Aguardando' },
  positivo: { classe: 'badge-positive', label: 'Positivo' },
  negativo: { classe: 'badge-negative', label: 'Negativo' },
  inconclusivo: { classe: 'badge-inconclusive', label: 'Inconclusivo' },
  material_inadequado: { classe: 'badge-neutral', label: 'Material inadequado' },
  nao_realizado: { classe: 'badge-neutral', label: 'Não realizado' },
}

export function badgeDeResultado(resultado: CatalogoItem): Badge {
  return RESULTADO_BADGE_MAP[resultado.codigo] ?? { classe: 'badge-neutral', label: resultado.nome }
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
