import { http } from '../../lib/http'
import type { PaginaResponse } from '../usuarios/usuarios.types'
import type { Animal, AnimaisFiltro, Baia, CatalogosAnimal } from './animais.types'

// A tela de Animais só usa a lista de baias para popular o filtro (sem
// paginação própria) — pedimos uma página grande o bastante para cobrir as
// baias ativas do CCZ. A gestão de baias em si (CRUD completo) é uma tela
// futura própria (nav "Gestão de Baias" já existe, ainda sem rota).
const TAMANHO_PAGINA_SEM_UI_DE_PAGINACAO = 100

export function listarAnimais(filtro: AnimaisFiltro): Promise<PaginaResponse<Animal>> {
  return http.get<PaginaResponse<Animal>>('/animais', { params: filtro }).then((response) => response.data)
}

export function listarCatalogosAnimais(): Promise<CatalogosAnimal> {
  return http.get<CatalogosAnimal>('/animais/catalogos').then((response) => response.data)
}

export function listarBaiasAtivas(): Promise<Baia[]> {
  return http
    .get<PaginaResponse<Baia>>('/baias', { params: { ativa: true, pagina: 0, tamanho: TAMANHO_PAGINA_SEM_UI_DE_PAGINACAO } })
    .then((response) => response.data.itens)
}
