import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  adicionarNota,
  atualizarOcorrencia,
  avancarStatusProcesso,
  buscarCatalogosOcorrencia,
  buscarOcorrenciaPorId,
  contarOcorrenciasPorBairro,
  criarOcorrencia,
  encerrarOcorrencia,
  iniciarAtendimento,
  listarOcorrencias,
} from '../api/ocorrenciasApi'
import type {
  AtualizarOcorrenciaRequest,
  CriarOcorrenciaRequest,
  EncerrarOcorrenciaRequest,
  Ocorrencia,
  OcorrenciasFiltro,
  QuantidadePorBairro,
  StatusProcesso,
} from '../types/ocorrencias.types'

function chaveDetalhe(id: string) {
  return ['ocorrencias', 'detalhe', id]
}

const CHAVE_ESTATISTICAS = ['ocorrencias', 'estatisticas']
const CHAVE_CONTAGEM_ABERTAS = ['ocorrencias', 'contagem', 'ABERTA']

export function useOcorrenciasAbertasCount(habilitado: boolean) {
  return useQuery({
    queryKey: CHAVE_CONTAGEM_ABERTAS,
    queryFn: ({ signal }) => listarOcorrencias({ status: 'ABERTA', pagina: 0, tamanho: 1 }, signal),
    select: (pagina) => pagina.totalItens,
    enabled: habilitado,
    staleTime: 60 * 1000,
  })
}

export function useContagemPorBairroQuery<T>(select: (linhas: QuantidadePorBairro[]) => T) {
  return useQuery({
    queryKey: [...CHAVE_ESTATISTICAS, 'bairro'],
    queryFn: contarOcorrenciasPorBairro,
    staleTime: 60 * 1000,
    select,
  })
}

export function useOcorrenciasQuery(filtro: OcorrenciasFiltro) {
  return useQuery({
    queryKey: ['ocorrencias', 'lista', filtro],
    queryFn: () => listarOcorrencias(filtro),
    placeholderData: (dadosAnteriores) => dadosAnteriores,
  })
}

export function useOcorrenciaQuery(id: string | undefined) {
  return useQuery({
    queryKey: chaveDetalhe(id as string),
    queryFn: () => buscarOcorrenciaPorId(id as string),
    enabled: Boolean(id),
  })
}

export function useCatalogosOcorrenciaQuery() {
  return useQuery({
    queryKey: ['ocorrencias', 'catalogos'],
    queryFn: buscarCatalogosOcorrencia,
    staleTime: Infinity,
  })
}

function useAtualizarCacheDaOcorrencia() {
  const queryClient = useQueryClient()
  return (ocorrencia: Ocorrencia) => {
    queryClient.setQueryData(chaveDetalhe(ocorrencia.id), ocorrencia)
    void queryClient.invalidateQueries({ queryKey: ['ocorrencias', 'lista'] })
    void queryClient.invalidateQueries({ queryKey: CHAVE_ESTATISTICAS })
    void queryClient.invalidateQueries({ queryKey: CHAVE_CONTAGEM_ABERTAS })
  }
}

function useRecarregarOcorrencia(id: string) {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: ['ocorrencias', 'lista'] })
    void queryClient.invalidateQueries({ queryKey: CHAVE_ESTATISTICAS })
    void queryClient.invalidateQueries({ queryKey: CHAVE_CONTAGEM_ABERTAS })
    return queryClient.invalidateQueries({ queryKey: chaveDetalhe(id) })
  }
}

export function useCriarOcorrenciaMutation() {
  const atualizarCache = useAtualizarCacheDaOcorrencia()
  return useMutation({
    mutationFn: (payload: CriarOcorrenciaRequest) => criarOcorrencia(payload),
    onSuccess: atualizarCache,
  })
}

export function useAtualizarOcorrenciaMutation(id: string) {
  const recarregar = useRecarregarOcorrencia(id)
  return useMutation({
    mutationFn: (payload: AtualizarOcorrenciaRequest) => atualizarOcorrencia(id, payload),
    onSuccess: recarregar,
  })
}

export function useIniciarAtendimentoMutation(id: string) {
  const recarregar = useRecarregarOcorrencia(id)
  return useMutation({
    mutationFn: () => iniciarAtendimento(id),
    onSuccess: recarregar,
  })
}

export function useEncerrarOcorrenciaMutation(id: string) {
  const recarregar = useRecarregarOcorrencia(id)
  return useMutation({
    mutationFn: (payload: EncerrarOcorrenciaRequest) => encerrarOcorrencia(id, payload),
    onSuccess: recarregar,
  })
}

export function useAdicionarNotaMutation(id: string) {
  const recarregar = useRecarregarOcorrencia(id)
  return useMutation({
    mutationFn: (descricao: string) => adicionarNota(id, descricao),
    onSuccess: recarregar,
  })
}

export function useAvancarStatusProcessoMutation(ocorrenciaId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ processoId, status }: { processoId: string; status: StatusProcesso }) =>
      avancarStatusProcesso(processoId, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: chaveDetalhe(ocorrenciaId) }),
  })
}
