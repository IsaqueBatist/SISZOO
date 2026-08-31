import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  atualizarAnimal,
  buscarAnimalPorId,
  criarAnimal,
  listarAnimais,
  listarBaiasAtivas,
  listarCatalogosAnimais,
} from './animaisApi'
import type { AnimaisFiltro, AnimalRequest } from './animais.types'

const ANIMAIS_QUERY_KEY = ['animais']

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
