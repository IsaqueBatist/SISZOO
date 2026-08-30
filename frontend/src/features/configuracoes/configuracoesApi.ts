import { http } from '../../lib/http'
import type { AtualizarPreferenciasRequest, PreferenciaUsuario } from './configuracoes.types'

export function buscarPreferencias(): Promise<PreferenciaUsuario> {
  return http.get<PreferenciaUsuario>('/usuarios/me/preferencias').then((response) => response.data)
}

export function atualizarPreferencias(payload: AtualizarPreferenciasRequest): Promise<PreferenciaUsuario> {
  return http.patch<PreferenciaUsuario>('/usuarios/me/preferencias', payload).then((response) => response.data)
}
