export interface Badge {
  classe: string
  label: string
}

const STATUS_BADGE_MAP: Record<string, Badge> = {
  disponivel_adocao: { classe: 'badge-available', label: 'Disponível' },
  em_tratamento: { classe: 'badge-treatment', label: 'Em tratamento' },
  em_quarentena: { classe: 'badge-quarantine', label: 'Em quarentena' },
  adotado: { classe: 'badge-adopted', label: 'Adotado' },
  obito_natural: { classe: 'badge-deceased', label: 'Falecido' },
  obito_eutanasia: { classe: 'badge-deceased', label: 'Falecido' },
  transferido: { classe: 'badge-neutral', label: 'Transferido' },
}

export function badgeDeStatus(statusCodigo: string, statusNome: string): Badge {
  return STATUS_BADGE_MAP[statusCodigo] ?? { classe: 'badge-neutral', label: statusNome }
}

const ESPECIE_BADGE_MAP: Record<string, Badge> = {
  canino: { classe: 'badge-canine', label: 'Canino' },
  felino: { classe: 'badge-feline', label: 'Felino' },
}

export function badgeDeEspecie(especieCodigo: string, especieNome: string): Badge {
  return ESPECIE_BADGE_MAP[especieCodigo] ?? { classe: 'badge-neutral', label: especieNome }
}
