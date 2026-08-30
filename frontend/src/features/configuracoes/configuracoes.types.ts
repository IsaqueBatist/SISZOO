// Espelha PreferenciaUsuarioResponse/Request do backend (entity TemaUsuario /
// DensidadeUsuario). "notifAlertasCriticos" é sempre true e nunca é enviado
// como false — o backend rejeita essa tentativa com 422.

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
