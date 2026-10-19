// Mirror manual dos valores de --disease-* em styles/tokens.css — mesmo
// padrão já usado em lib/theme.ts para --color-danger/warning/alert/info.
// Atualizar os dois juntos se o design system mudar essas cores.
//
// Mapeamento codigo -> slug replica features/processos/utils/statusBadge.ts
// (classeDeDoenca), para o gráfico usar a MESMA cor que o badge de doença já
// usado em /processos e /animais/:id.
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

const COR_FALLBACK = '#9AAABB' // --color-text-muted, para codigo desconhecido

export function corDoenca(codigo: string): string {
  const slug = DOENCA_SLUG[codigo]
  return (slug && CORES_POR_SLUG[slug]) || COR_FALLBACK
}
