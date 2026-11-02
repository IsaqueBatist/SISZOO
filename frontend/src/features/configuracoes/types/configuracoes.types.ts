export type TemaUsuario = 'LIGHT' | 'DARK'
export type DensidadeUsuario = 'COMPACTO' | 'NORMAL' | 'CONFORTAVEL'

export interface PreferenciaUsuario {
  tema: TemaUsuario
  densidade: DensidadeUsuario
  notifAlertasCriticos: boolean
  notifVacinaVencendo: boolean
  notifSuperlotacao: boolean
  notifResultadoLab: boolean
  notifEmailDiario: boolean
}

export type AtualizarPreferenciasRequest = PreferenciaUsuario
