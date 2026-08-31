import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  alterarStatusBaia,
  atualizarAnimal,
  atualizarBaia,
  buscarAnimalPorId,
  criarAnimal,
  criarBaia,
  excluirBaia,
  listarAnimais,
  listarBaias,
  listarBaiasAtivas,
  listarCatalogosAnimais,
} from './animaisApi'
import type { AnimaisFiltro, AnimalRequest, BaiaRequest } from './animais.types'

const ANIMAIS_QUERY_KEY = ['animais']
const BAIAS_QUERY_KEY = ['baias']

// A key inclui o objeto de filtro inteiro: qualquer mudança de status,
// espécie, busca ou página gera uma key nova e refaz a query automaticamente,
// sem precisar de invalidateQueries manual.
export function useAnimaisQuery(filtro: AnimaisFiltro) {
  return useQuery({
    queryKey: ['animais', filtro],
    queryFn: () => listarAnimais(filtro),
    placeholderData: (dadosAnteriores) => dadosAnteriores,
  })
}

export function useCatalogosAnimaisQuery() {
  return useQuery({
    queryKey: ['animais', 'catalogos'],
    queryFn: listarCatalogosAnimais,
    staleTime: Infinity,
  })
}

export function useBaiasAtivasQuery() {
  return useQuery({
    queryKey: ['baias', { ativa: true }],
    queryFn: listarBaiasAtivas,
  })
}

export function useAnimalQuery(id: string | undefined) {
  return useQuery({
    queryKey: ['animais', 'detalhe', id],
    queryFn: () => buscarAnimalPorId(id as string),
    enabled: Boolean(id),
  })
}

export function useCriarAnimalMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: criarAnimal,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ANIMAIS_QUERY_KEY }),
  })
}

export function useAtualizarAnimalMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AnimalRequest }) => atualizarAnimal(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ANIMAIS_QUERY_KEY }),
  })
}

// Traz ativas e inativas — usado pela tela de gestão (T19), que filtra por
// status em memória. Key própria, distinta de `['baias', { ativa: true }]`
// (dropdown de filtro em /animais), mas invalidada junto por compartilhar o
// prefixo `['baias']`.
export function useBaiasQuery() {
  return useQuery({
    queryKey: BAIAS_QUERY_KEY,
    queryFn: listarBaias,
  })
}

export function useCriarBaiaMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: criarBaia,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: BAIAS_QUERY_KEY }),
  })
}

export function useAtualizarBaiaMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: BaiaRequest }) => atualizarBaia(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: BAIAS_QUERY_KEY }),
  })
}

export function useExcluirBaiaMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: excluirBaia,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: BAIAS_QUERY_KEY }),
  })
}

export function useAlterarStatusBaiaMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ativa }: { id: string; ativa: boolean }) => alterarStatusBaia(id, ativa),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: BAIAS_QUERY_KEY }),
  })
}
