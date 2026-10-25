import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import {
  avancarStatusProcesso,
  buscarCatalogosProcesso,
  buscarProcessoPorId,
  criarProcesso,
  listarProcessos,
  reenviarNotificacaoMunicipe,
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

// O detalhe recebe a resposta gravada pelo servidor; listagens de processos e
// listagem e detalhes de ocorrências são invalidados (a ocorrência vinculada
// ganha o processo e pode passar a urgente, D31). Catálogos (staleTime
// Infinity) e a contagem por bairro não mudam com processo e ficam de fora (T45).
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

// T34 + T37: substitui o avanço provisório só para AGUARDANDO_RESULTADO ->
// COM_RESULTADO (lançamento) ou corrige o vigente (com retificaId). A
// resposta já traz o histórico completo em `resultados`.
export function useRegistrarResultadoMutation(id: string) {
  const atualizarCache = useAtualizarCacheDoProcesso()
  return useMutation({
    mutationFn: (payload: RegistrarResultadoRequest) => registrarResultado(id, payload),
    onSuccess: atualizarCache,
  })
}

// T35 (pendência): reenvio manual quando o primeiro envio falhou. A resposta
// ainda traz dataNotificacaoMunicipe nula (o envio é assíncrono) — a tela
// volta a acompanhar o processo como no lançamento inicial do positivo.
export function useReenviarNotificacaoMutation(id: string) {
  const atualizarCache = useAtualizarCacheDoProcesso()
  return useMutation({
    mutationFn: () => reenviarNotificacaoMunicipe(id),
    onSuccess: atualizarCache,
  })
}

// A resposta é a ocorrência: o detalhe do processo é recarregado do servidor.
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
