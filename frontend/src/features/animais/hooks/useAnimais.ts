import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import {
  enviarAnexoAnimal,
  listarAnexosAnimal,
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
  listarResidentesDeBaias,
} from '../api/animaisApi'
import type { AnimaisFiltro, AnimalRequest, BaiaRequest } from '../types/animais.types'

const ANIMAIS_QUERY_KEY = ['animais']
const BAIAS_QUERY_KEY = ['baias']

export function useAnimaisQuery(filtro: AnimaisFiltro, habilitada = true) {
  return useQuery({
    queryKey: ['animais', filtro],
    queryFn: () => listarAnimais(filtro),
    placeholderData: (dadosAnteriores) => dadosAnteriores,
    enabled: habilitada,
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
    onSuccess: () => invalidarAnimaisEBaias(queryClient),
  })
}

export function useAtualizarAnimalMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AnimalRequest }) => atualizarAnimal(id, payload),
    onSuccess: () => invalidarAnimaisEBaias(queryClient),
  })
}

function invalidarAnimaisEBaias(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({
      queryKey: ANIMAIS_QUERY_KEY,
      predicate: (query) => query.queryKey[1] !== 'catalogos' && query.queryKey[1] !== 'anexos',
    }),
    queryClient.invalidateQueries({ queryKey: BAIAS_QUERY_KEY }),
  ])
}

export function useAnexosAnimalQuery(animalId: string) {
  return useQuery({
    queryKey: ['animais', 'anexos', animalId],
    queryFn: () => listarAnexosAnimal(animalId),
    enabled: Boolean(animalId),
  })
}

export function useEnviarAnexoAnimalMutation(animalId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ arquivo, descricao }: { arquivo: File; descricao?: string }) => enviarAnexoAnimal(animalId, arquivo, descricao),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['animais', 'anexos', animalId] }),
  })
}

export function useBaiasQuery() {
  return useQuery({
    queryKey: BAIAS_QUERY_KEY,
    queryFn: listarBaias,
  })
}

export function useResidentesDeBaiasQuery() {
  return useQuery({
    queryKey: [...BAIAS_QUERY_KEY, 'residentes'],
    queryFn: listarResidentesDeBaias,
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
