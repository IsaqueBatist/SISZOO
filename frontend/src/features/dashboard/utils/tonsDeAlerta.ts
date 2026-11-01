import type { SeveridadeAlertaCritico } from '../types/dashboard.types'

// Tom visual (classe do design system) dos alertas críticos, num lugar só:
// o dashboard e o sino da topbar mostram os mesmos alertas e não podem
// divergir de cor.
export type TomDeAlerta = 'danger' | 'warning' | 'alert-yellow' | 'info'

// Tom por TIPO, como no protótipo (docs/prototipo/dashboard.html): não deriva
// de `severidade` porque o protótipo usa classes mais granulares que a enum do
// DER — fiel ao visual já validado, em vez de uma conversão aproximada.
export const TOM_POR_TIPO_DE_ALERTA: Record<string, TomDeAlerta> = {
  sem_avaliacao_30d: 'alert-yellow',
  baia_superlotada: 'warning',
  medicacao_ativa: 'info',
  ficha_incompleta: 'info',
  nao_castrado: 'danger',
}

// Reserva para um tipo que o backend passe a emitir e que o mapa acima ainda
// não conheça: a severidade vem na própria resposta, então o alerta aparece
// com um tom coerente em vez de cair sempre no neutro.
export const TOM_POR_SEVERIDADE_ALERTA: Record<SeveridadeAlertaCritico, TomDeAlerta> = {
  critico: 'danger',
  atencao: 'warning',
  info: 'info',
}

export function tomDoAlerta(tipo: string, severidade: SeveridadeAlertaCritico): TomDeAlerta {
  return TOM_POR_TIPO_DE_ALERTA[tipo] ?? TOM_POR_SEVERIDADE_ALERTA[severidade] ?? 'info'
}
