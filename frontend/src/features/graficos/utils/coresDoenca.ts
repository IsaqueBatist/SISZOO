const CORES_POR_SLUG: Record<string, string> = {
  raiva: '#C62828',
  esporotricose: '#6A1B9A',
  leishmaniose: '#F57F17',
  leptospirose: '#1565C0',
  'febre-maculosa': '#E65100',
  'febre-amarela': '#F9A825',
}

const DOENCA_SLUG: Record<string, string> = {
  raiva: 'raiva',
  esporotricose: 'esporotricose',
  leishmaniose_visceral: 'leishmaniose',
  leptospirose: 'leptospirose',
  febre_maculosa: 'febre-maculosa',
  febre_amarela: 'febre-amarela',
}

const COR_FALLBACK = '#9AAABB'

export function corDoenca(codigo: string): string {
  const slug = DOENCA_SLUG[codigo]
  return (slug && CORES_POR_SLUG[slug]) || COR_FALLBACK
}
