import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  avancarStatusProcesso,
  buscarCatalogosProcesso,
  buscarHistoricoProcesso,
  buscarProcessoPorId,
  criarProcesso,
  listarProcessos,
  registrarResultado,
  vincularOcorrencia,
} from '../api/processosApi'
import type {
  CriarProcessoRequest,
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

export function useCatalogosProcessoQuery() {
  return useQuery({
    queryKey: ['processos', 'catalogos'],
    queryFn: buscarCatalogosProcesso,
    staleTime: Infinity,
  })
}

// T37: mini trilha de auditoria — só existe depois que o processo já foi
// lido (não precisa de `enabled`, sempre chamado com um id de processo real).
export function useHistoricoProcessoQuery(id: string) {
  return useQuery({
    queryKey: ['processos', 'historico', id],
    queryFn: () => buscarHistoricoProcesso(id),
  })
}

// O detalhe recebe a resposta gravada pelo servidor; listagens de processos e
// ocorrências são invalidadas (a ocorrência vinculada ganha o processo e pode
// passar a urgente, D31).
function useAtualizarCacheDoProcesso() {
  const queryClient = useQueryClient()
  return (processo: Processo) => {
    queryClient.setQueryData(chaveDetalhe(processo.id), processo)
    void queryClient.invalidateQueries({ queryKey: ['processos', 'lista'] })
    void queryClient.invalidateQueries({ queryKey: ['ocorrencias'] })
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

// T37: substitui o avanço provisório só para AGUARDANDO_RESULTADO ->
// COM_RESULTADO. Também invalida o histórico, já que o lançamento grava um
// novo evento de auditoria (ATUALIZACAO).
export function useRegistrarResultadoMutation(id: string) {
  const atualizarCache = useAtualizarCacheDoProcesso()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: RegistrarResultadoRequest) => registrarResultado(id, payload),
    onSuccess: (processo) => {
      atualizarCache(processo)
      void queryClient.invalidateQueries({ queryKey: ['processos', 'historico', id] })
    },
  })
}

// A resposta é a ocorrência: o detalhe do processo é recarregado do servidor.
export function useVincularOcorrenciaMutation(processoId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ocorrenciaId: string) => vincularOcorrencia(processoId, ocorrenciaId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['processos'] })
      void queryClient.invalidateQueries({ queryKey: ['ocorrencias'] })
    },
  })
}
