// Alerta de reforço vacinal: 7 dias de antecedência. Valor consistente em
// toda fonte do projeto que o menciona — docs/CLAUDE.md (regra crítica),
// docs/entrevista_09jan2026.md ("alertas de vacina com 7 dias") e os
// protótipos configuracoes.html/dashboard.html/design-system.html — mas o
// backend não tem essa constante hoje (nem endpoint dedicado), por isso o
// cálculo é feito aqui no frontend.
export const DIAS_ANTECEDENCIA_ALERTA_VACINA = 7

const FUSO_ITU = 'America/Sao_Paulo'
const UM_DIA_MS = 24 * 60 * 60 * 1000

export type StatusReforcoVacina = 'vencida' | 'a_vencer' | 'em_dia'

export interface BadgeReforcoVacina {
  status: StatusReforcoVacina
  classeLinha: 'reforco-warning' | 'reforco-soon' | ''
  classeBadge: string
  label: string
}

// Data-only (sem hora) em UTC, para comparar dias de calendário sem sofrer
// deslocamento de fuso horário: tanto "hoje" (calculado no fuso de Itu)
// quanto `dataValidade` (LocalDate do backend, sem hora) são interpretados
// como o mesmo dia civil, não como um instante.
function paraDataUtc(isoDate: string): number {
  const [ano, mes, dia] = isoDate.split('-').map(Number)
  return Date.UTC(ano, mes - 1, dia)
}

export function hojeEmItu(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: FUSO_ITU }).format(new Date())
}

export function diasAteVencimento(dataValidade: string, hoje: string = hojeEmItu()): number {
  return Math.round((paraDataUtc(dataValidade) - paraDataUtc(hoje)) / UM_DIA_MS)
}

// `dataValidade` nula (vacina sem intervaloMeses cadastrado no catálogo) →
// sem badge de vencimento, não é seguro presumir um status.
export function badgeReforcoVacina(dataValidade: string | null, hoje: string = hojeEmItu()): BadgeReforcoVacina | null {
  if (!dataValidade) return null

  const dias = diasAteVencimento(dataValidade, hoje)

  if (dias < 0) {
    return { status: 'vencida', classeLinha: 'reforco-warning', classeBadge: 'badge-positive', label: '⚠ Vencida' }
  }
  if (dias <= DIAS_ANTECEDENCIA_ALERTA_VACINA) {
    return {
      status: 'a_vencer',
      classeLinha: 'reforco-soon',
      classeBadge: 'badge-alert',
      label: dias === 0 ? '⚠ Vence hoje' : `⚠ Em ${dias} dia${dias === 1 ? '' : 's'}`,
    }
  }
  return { status: 'em_dia', classeLinha: '', classeBadge: 'badge-available', label: 'Em dia' }
}
