import { http } from '../../lib/http'
import type { PaginaResponse } from '../usuarios/usuarios.types'
import type { Animal, AnimaisFiltro, CatalogosAnimal } from './animais.types'

export function listarAnimais(filtro: AnimaisFiltro): Promise<PaginaResponse<Animal>> {
  return http.get<PaginaResponse<Animal>>('/animais', { params: filtro }).then((response) => response.data)
}

export function listarCatalogosAnimais(): Promise<CatalogosAnimal> {
  return http.get<CatalogosAnimal>('/animais/catalogos').then((response) => response.data)
}
