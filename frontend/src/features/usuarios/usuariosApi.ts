import { http } from '../../lib/http'
import type { CriarUsuarioRequest, UsuarioListItem } from './usuarios.types'

export function listarUsuarios(): Promise<UsuarioListItem[]> {
  return http.get<UsuarioListItem[]>('/usuarios').then((response) => response.data)
}

export function criarUsuario(payload: CriarUsuarioRequest): Promise<UsuarioListItem> {
  return http.post<UsuarioListItem>('/usuarios', payload).then((response) => response.data)
}

export function alterarStatusUsuario(id: string, ativo: boolean): Promise<UsuarioListItem> {
  return http.patch<UsuarioListItem>(`/usuarios/${id}/status`, { ativo }).then((response) => response.data)
}
