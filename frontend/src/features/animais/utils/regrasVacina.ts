import { hojeEmItu } from '@/lib/datas'

export { hojeEmItu }

export const DIAS_ANTECEDENCIA_ALERTA_VACINA = 7

const UM_DIA_MS = 24 * 60 * 60 * 1000

export type StatusReforcoVacina = 'vencida' | 'a_vencer' | 'em_dia'

export interface BadgeReforcoVacina {
  status: StatusReforcoVacina
  classeLinha: 'reforco-warning' | 'reforco-soon' | ''
  classeBadge: string
  label: string
}

function paraDataUtc(isoDate: string): number {
  const [ano, mes, dia] = isoDate.split('-').map(Number)
  return Date.UTC(ano, mes - 1, dia)
}

export function diasAteVencimento(dataValidade: string, hoje: string = hojeEmItu()): number {
  return Math.round((paraDataUtc(dataValidade) - paraDataUtc(hoje)) / UM_DIA_MS)
}

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
      classeBadge: 'badge-inconclusive',
      label: dias === 0 ? '⚠ Vence hoje' : `⚠ Em ${dias} dia${dias === 1 ? '' : 's'}`,
    }
  }
  return { status: 'em_dia', classeLinha: '', classeBadge: 'badge-available', label: 'Em dia' }
}
