import { http } from '@/lib/http'
import type { PaginaResponse } from '@/features/usuarios/types/usuarios.types'
import type { Animal, AnimaisFiltro, AnimalRequest, AnexoAnimal, Baia, BaiaRequest, CatalogosAnimal } from '../types/animais.types'

// A tela de Animais só usa a lista de baias para popular o filtro (sem
// paginação própria) — pedimos uma página grande o bastante para cobrir as
// baias ativas do CCZ. A tela de gestão de baias (T19) usa `listarBaias`
// abaixo, que traz ativas e inativas.
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

export function buscarAnimalPorId(id: string): Promise<Animal> {
  return http.get<Animal>(`/animais/${id}`).then((response) => response.data)
}

export function criarAnimal(payload: AnimalRequest): Promise<Animal> {
  return http.post<Animal>('/animais', payload).then((response) => response.data)
}

export function atualizarAnimal(id: string, payload: AnimalRequest): Promise<Animal> {
  return http.put<Animal>(`/animais/${id}`, payload).then((response) => response.data)
}

// Sem `ativa` (diferente de `listarBaiasAtivas`): a tela de gestão precisa
// ver e filtrar também as baias inativas, então traz tudo numa página só e
// filtra por status em memória, junto com tipo/lotação/busca.
// F2-007 / RF-A04: anexos do animal (mesmo contrato dos anexos de ocorrência).
export function listarAnexosAnimal(animalId: string): Promise<AnexoAnimal[]> {
  return http.get<AnexoAnimal[]>(`/animais/${animalId}/anexos`).then((response) => response.data)
}

export async function enviarAnexoAnimal(animalId: string, arquivo: File, descricao?: string): Promise<AnexoAnimal> {
  const formulario = new FormData()
  formulario.append('arquivo', arquivo)
  if (descricao) formulario.append('descricao', descricao)
  const { data } = await http.post<AnexoAnimal>(`/animais/${animalId}/anexos`, formulario)
  return data
}

// O download precisa do token: baixa como Blob e quem chama cria/revoga o object URL.
export async function baixarAnexoAnimal(animalId: string, anexoId: string): Promise<Blob> {
  const { data } = await http.get<Blob>(`/animais/${animalId}/anexos/${anexoId}`, { responseType: 'blob' })
  return data
}

export function listarBaias(): Promise<Baia[]> {
  return http
    .get<PaginaResponse<Baia>>('/baias', { params: { pagina: 0, tamanho: TAMANHO_PAGINA_SEM_UI_DE_PAGINACAO } })
    .then((response) => response.data.itens)
}

export function criarBaia(payload: BaiaRequest): Promise<Baia> {
  return http.post<Baia>('/baias', payload).then((response) => response.data)
}

export function atualizarBaia(id: string, payload: BaiaRequest): Promise<Baia> {
  return http.put<Baia>(`/baias/${id}`, payload).then((response) => response.data)
}

export function excluirBaia(id: string): Promise<Baia> {
  return http.delete<Baia>(`/baias/${id}`).then((response) => response.data)
}

export function alterarStatusBaia(id: string, ativa: boolean): Promise<Baia> {
  return http.patch<Baia>(`/baias/${id}/status`, { ativa }).then((response) => response.data)
}
