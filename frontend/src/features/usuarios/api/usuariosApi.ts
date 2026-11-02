import { http } from '@/lib/http'
import type { AtualizarUsuarioRequest, CriarUsuarioRequest, PaginaResponse, UsuarioListItem } from '../types/usuarios.types'

// A tela de Usuários não tem paginação própria (lista tudo e filtra no
// cliente): pedimos uma página grande o bastante para cobrir o quadro de
// funcionários do CCZ.
const TAMANHO_PAGINA_SEM_UI_DE_PAGINACAO = 100

export function listarUsuarios(): Promise<UsuarioListItem[]> {
  return http
    .get<PaginaResponse<UsuarioListItem>>('/usuarios', {
      params: { pagina: 0, tamanho: TAMANHO_PAGINA_SEM_UI_DE_PAGINACAO },
    })
    .then((response) => response.data.itens)
}

export function criarUsuario(payload: CriarUsuarioRequest): Promise<UsuarioListItem> {
  return http.post<UsuarioListItem>('/usuarios', payload).then((response) => response.data)
}

export function atualizarUsuario(id: string, payload: AtualizarUsuarioRequest): Promise<UsuarioListItem> {
  return http.put<UsuarioListItem>(`/usuarios/${id}`, payload).then((response) => response.data)
}

// Backend responde 204: a senha não volta em nenhuma resposta.
export function redefinirSenhaUsuario(id: string, senhaTemporaria: string): Promise<void> {
  return http.post(`/usuarios/${id}/senha`, { senhaTemporaria }).then(() => undefined)
}

export function alterarStatusUsuario(id: string, ativo: boolean): Promise<UsuarioListItem> {
  return http.patch<UsuarioListItem>(`/usuarios/${id}/status`, { ativo }).then((response) => response.data)
}
