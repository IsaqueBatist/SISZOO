import type { SeveridadeAlertaCritico } from '../types/dashboard.types'

export type TomDeAlerta = 'danger' | 'warning' | 'alert-yellow' | 'info'

export const TOM_POR_SEVERIDADE_ALERTA: Record<SeveridadeAlertaCritico, TomDeAlerta> = {
  critico: 'danger',
  atencao: 'warning',
  info: 'info',
}
