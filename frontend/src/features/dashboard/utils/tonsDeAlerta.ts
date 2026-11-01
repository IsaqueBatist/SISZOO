import type { SeveridadeAlertaCritico } from '../types/dashboard.types'

// Tom visual (classe do design system) de um alerta crítico quando só se tem
// a severidade. O dashboard mapeia por TIPO, que é mais granular e segue o
// protótipo (ver TOM_POR_TIPO_DE_ALERTA em Dashboard.tsx); o sino da topbar
// resume alertas de tipos que não conhece de antemão, então cai na severidade,
// que vem na própria resposta da API.
export type TomDeAlerta = 'danger' | 'warning' | 'alert-yellow' | 'info'

export const TOM_POR_SEVERIDADE_ALERTA: Record<SeveridadeAlertaCritico, TomDeAlerta> = {
  critico: 'danger',
  atencao: 'warning',
  info: 'info',
}
