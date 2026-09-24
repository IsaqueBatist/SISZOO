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

const TIPO_LABEL_MAP: Record<string, string> = {
  zoonose: 'Suspeita de Zoonose',
  morcegos: 'Morcegos',
  irregular: 'Situação Irregular',
  agressivo: 'Animal Agressivo',
  outros: 'Outros',
}

export function labelDeTipo(tipo: string): string {
  return TIPO_LABEL_MAP[tipo] ?? tipo
}
