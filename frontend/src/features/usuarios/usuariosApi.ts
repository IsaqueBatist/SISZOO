import { http } from '../../lib/http'
import type { CriarUsuarioRequest, PaginaResponse, UsuarioListItem } from './usuarios.types'

// A tela de Usuários ainda não tem paginação própria (lista tudo e filtra no
// cliente) — pedimos uma página grande o bastante para cobrir o quadro de
// funcionários do CCZ. Paginação real de UI fica para uma tarefa futura.
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

export function alterarStatusUsuario(id: string, ativo: boolean): Promise<UsuarioListItem> {
  return http.patch<UsuarioListItem>(`/usuarios/${id}/status`, { ativo }).then((response) => response.data)
}
