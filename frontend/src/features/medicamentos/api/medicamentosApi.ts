import { http } from '@/lib/http'
import type { CategoriaFarmacologica, Medicamento } from '@/features/animais/types/historico.types'

export interface CriarMedicamentoRequest {
  nome: string
  categoriaId: string
}

// Só as ativas, ordenadas por nome (CategoriaFarmacologicaController).
export function listarCategoriasFarmacologicas(): Promise<CategoriaFarmacologica[]> {
  return http.get<CategoriaFarmacologica[]>('/categorias-farmacologicas').then((response) => response.data)
}

export function criarCategoriaFarmacologica(nome: string): Promise<CategoriaFarmacologica> {
  return http.post<CategoriaFarmacologica>('/categorias-farmacologicas', { nome }).then((response) => response.data)
}

export function criarMedicamento(payload: CriarMedicamentoRequest): Promise<Medicamento> {
  return http.post<Medicamento>('/medicamentos', payload).then((response) => response.data)
}
