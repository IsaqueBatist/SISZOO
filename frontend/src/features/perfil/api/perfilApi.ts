import { http } from '@/lib/http'
import type { UsuarioListItem } from '@/features/usuarios/types/usuarios.types'

export interface AtualizarTelefoneRequest {
  telefone: string
}

export function buscarPerfilProprio(): Promise<UsuarioListItem> {
  return http.get<UsuarioListItem>('/usuarios/me').then((response) => response.data)
}

export function atualizarTelefoneProprio(payload: AtualizarTelefoneRequest): Promise<UsuarioListItem> {
  return http.patch<UsuarioListItem>('/usuarios/me', payload).then((response) => response.data)
}
