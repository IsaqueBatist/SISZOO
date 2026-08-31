export interface Badge {
  classe: string
  label: string
}

// O catálogo real de status (status_animal) tem 7 valores, mas o design
// system só define badge dedicado para 5. Óbito natural e óbito eutanásia
// caem ambos em "Falecido" (badge-deceased); transferido usa o fallback
// neutro, já que não existe classe própria para ele.
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

// Só canino e felino têm classe de badge dedicada; quiróptero e primata
// não-humano caem no fallback neutro.
const ESPECIE_BADGE_MAP: Record<string, Badge> = {
  canino: { classe: 'badge-canine', label: 'Canino' },
  felino: { classe: 'badge-feline', label: 'Felino' },
}

export function badgeDeEspecie(especieCodigo: string, especieNome: string): Badge {
  return ESPECIE_BADGE_MAP[especieCodigo] ?? { classe: 'badge-neutral', label: especieNome }
}
