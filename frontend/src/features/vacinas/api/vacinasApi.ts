import { http } from '@/lib/http'
import type { PaginaResponse } from '@/features/usuarios/types/usuarios.types'
import type { AtualizarVacinaRequest, CriarVacinaRequest, Vacina } from '../types/vacinas.types'

// Teto de 500 por página (Paginacao, no backend). O catálogo do CCZ tem
// dezenas de itens, então uma página basta e evita paginar uma tela de apoio.
const TAMANHO_CATALOGO = 500

export function listarVacinas(ativo?: boolean): Promise<PaginaResponse<Vacina>> {
  return http
    .get<PaginaResponse<Vacina>>('/vacinas', { params: { ativo, pagina: 0, tamanho: TAMANHO_CATALOGO } })
    .then((response) => response.data)
}

export function criarVacina(payload: CriarVacinaRequest): Promise<Vacina> {
  return http.post<Vacina>('/vacinas', payload).then((response) => response.data)
}

export function atualizarVacina(id: string, payload: AtualizarVacinaRequest): Promise<Vacina> {
  return http.put<Vacina>(`/vacinas/${id}`, payload).then((response) => response.data)
}

export function desativarVacina(id: string): Promise<Vacina> {
  return http.delete<Vacina>(`/vacinas/${id}`).then((response) => response.data)
}
