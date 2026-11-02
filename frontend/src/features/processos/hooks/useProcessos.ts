import { useCallback } from 'react'
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import {
  avancarStatusProcesso,
  buscarCatalogosProcesso,
  buscarProcessoPorId,
  criarProcesso,
  editarProcesso,
  listarAlteracoesProcesso,
  listarProcessos,
  reenviarNotificacaoMunicipe,
  registrarResultado,
  vincularOcorrencia,
} from '../api/processosApi'
import type {
  CriarProcessoRequest,
  EditarProcessoRequest,
  Processo,
  ProcessosFiltro,
  RegistrarResultadoRequest,
  StatusProcesso,
} from '../types/processos.types'

function chaveDetalhe(id: string) {
  return ['processos', 'detalhe', id]
}

export function useProcessosQuery(filtro: ProcessosFiltro) {
  return useQuery({
    queryKey: ['processos', 'lista', filtro],
    queryFn: () => listarProcessos(filtro),
    placeholderData: (dadosAnteriores) => dadosAnteriores,
  })
}

export function useProcessoQuery(id: string | undefined) {
  return useQuery({
    queryKey: chaveDetalhe(id as string),
    queryFn: () => buscarProcessoPorId(id as string),
    enabled: Boolean(id),
  })
}

export function useAlteracoesProcessoQuery(id: string) {
  return useQuery({ queryKey: ['processos', 'alteracoes', id], queryFn: () => listarAlteracoesProcesso(id) })
}

export function useEditarProcessoMutation(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: EditarProcessoRequest) => editarProcesso(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['processos'] })
    },
  })
}

export function useReconsultarProcesso(id: string) {
  const queryClient = useQueryClient()
  return useCallback(async () => {
    const atualizado = await buscarProcessoPorId(id)
    queryClient.setQueryData(chaveDetalhe(id), atualizado)
    return atualizado
  }, [id, queryClient])
}

export function useCatalogosProcessoQuery() {
  return useQuery({
    queryKey: ['processos', 'catalogos'],
    queryFn: buscarCatalogosProcesso,
    staleTime: Infinity,
  })
}

function invalidarOcorrenciasAfetadas(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: ['ocorrencias', 'lista'] })
  void queryClient.invalidateQueries({ queryKey: ['ocorrencias', 'detalhe'] })
}

function useAtualizarCacheDoProcesso() {
  const queryClient = useQueryClient()
  return (processo: Processo) => {
    queryClient.setQueryData(chaveDetalhe(processo.id), processo)
    void queryClient.invalidateQueries({ queryKey: ['processos', 'lista'] })
    invalidarOcorrenciasAfetadas(queryClient)
  }
}

export function useCriarProcessoMutation() {
  const atualizarCache = useAtualizarCacheDoProcesso()
  return useMutation({
    mutationFn: (payload: CriarProcessoRequest) => criarProcesso(payload),
    onSuccess: atualizarCache,
  })
}

export function useAvancarStatusProcessoMutation(id: string) {
  const atualizarCache = useAtualizarCacheDoProcesso()
  return useMutation({
    mutationFn: (status: StatusProcesso) => avancarStatusProcesso(id, status),
    onSuccess: atualizarCache,
  })
}

export function useRegistrarResultadoMutation(id: string) {
  const atualizarCache = useAtualizarCacheDoProcesso()
  return useMutation({
    mutationFn: (payload: RegistrarResultadoRequest) => registrarResultado(id, payload),
    onSuccess: atualizarCache,
  })
}

export function useReenviarNotificacaoMutation(id: string) {
  const atualizarCache = useAtualizarCacheDoProcesso()
  return useMutation({
    mutationFn: () => reenviarNotificacaoMunicipe(id),
    onSuccess: atualizarCache,
  })
}

export function useVincularOcorrenciaMutation(processoId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ocorrenciaId: string) => vincularOcorrencia(processoId, ocorrenciaId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['processos', 'lista'] })
      void queryClient.invalidateQueries({ queryKey: ['processos', 'detalhe'] })
      invalidarOcorrenciasAfetadas(queryClient)
    },
  })
}
