import { http } from '../../lib/http'
import type { UsuarioListItem } from '../usuarios/usuarios.types'

// GET/PATCH /usuarios/me devolvem exatamente o mesmo formato de UsuarioResponse
// usado em GET /usuarios (T12) — por isso reaproveitamos UsuarioListItem em vez
// de duplicar o tipo. O backend hoje não devolve `telefone` na resposta (só
// aceita no PATCH), então a UI não tem como exibir o telefone já salvo.

export interface AtualizarTelefoneRequest {
  telefone: string
}

export function buscarPerfilProprio(): Promise<UsuarioListItem> {
  return http.get<UsuarioListItem>('/usuarios/me').then((response) => response.data)
}

export function atualizarTelefoneProprio(payload: AtualizarTelefoneRequest): Promise<UsuarioListItem> {
  return http.patch<UsuarioListItem>('/usuarios/me', payload).then((response) => response.data)
}
