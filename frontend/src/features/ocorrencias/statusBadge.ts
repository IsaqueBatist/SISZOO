import type { IconName } from '../../components/layout/Icon'

export interface Badge {
  classe: string
  label: string
}

const STATUS_BADGE_MAP: Record<string, Badge> = {
  aberta: { classe: 'badge-process-open', label: 'Aberta' },
  em_atendimento: { classe: 'badge-process-awaiting', label: 'Em atendimento' },
  encerrada: { classe: 'badge-process-closed', label: 'Encerrada' },
}

export function badgeDeStatus(status: string): Badge {
  return STATUS_BADGE_MAP[status] ?? { classe: 'badge-neutral', label: status }
}

// Rótulos idênticos aos de docs/prototipo/cadastrar-ocorrencia.html.
const TIPO_LABEL_MAP: Record<string, string> = {
  zoonose: 'Suspeita de Zoonose',
  morcegos: 'Infestação de Morcegos',
  irregular: 'Criação Irregular',
  agressivo: 'Animal Agressivo',
  outros: 'Outros',
}

export function labelDeTipo(tipo: string): string {
  return TIPO_LABEL_MAP[tipo] ?? tipo
}

const TIPO_ICONE_MAP: Record<string, IconName> = {
  zoonose: 'alert',
  morcegos: 'bat',
  irregular: 'home',
  agressivo: 'dog',
  outros: 'clipboard',
}

export function iconeDeTipo(tipo: string): IconName {
  return TIPO_ICONE_MAP[tipo] ?? 'clipboard'
}
