import { http } from '@/lib/http'
import type { PaginaResponse } from '@/features/usuarios/types/usuarios.types'
import type { CategoriaFarmacologica, Medicamento } from '@/features/animais/types/historico.types'

export interface CriarMedicamentoRequest {
  nome: string
  categoriaId: string
}

export function listarCategoriasFarmacologicas(): Promise<CategoriaFarmacologica[]> {
  return http.get<CategoriaFarmacologica[]>('/categorias-farmacologicas').then((response) => response.data)
}

export function criarCategoriaFarmacologica(nome: string): Promise<CategoriaFarmacologica> {
  return http.post<CategoriaFarmacologica>('/categorias-farmacologicas', { nome }).then((response) => response.data)
}

export function criarMedicamento(payload: CriarMedicamentoRequest): Promise<Medicamento> {
  return http.post<Medicamento>('/medicamentos', payload).then((response) => response.data)
}

export type AtualizarMedicamentoRequest = CriarMedicamentoRequest

export interface MedicamentosFiltro {
  ativo?: boolean
  categoriaId?: string
}

const TAMANHO_CATALOGO = 500

export function listarMedicamentos(filtro: MedicamentosFiltro = {}): Promise<PaginaResponse<Medicamento>> {
  return http
    .get<PaginaResponse<Medicamento>>('/medicamentos', {
      params: { ativo: filtro.ativo, categoriaId: filtro.categoriaId, pagina: 0, tamanho: TAMANHO_CATALOGO },
    })
    .then((response) => response.data)
}

export function atualizarMedicamento(id: string, payload: AtualizarMedicamentoRequest): Promise<Medicamento> {
  return http.put<Medicamento>(`/medicamentos/${id}`, payload).then((response) => response.data)
}

export function desativarMedicamento(id: string): Promise<Medicamento> {
  return http.delete<Medicamento>(`/medicamentos/${id}`).then((response) => response.data)
}
