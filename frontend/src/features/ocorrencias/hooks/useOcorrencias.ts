import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  adicionarNota,
  atualizarOcorrencia,
  avancarStatusProcesso,
  buscarCatalogosOcorrencia,
  buscarOcorrenciaPorId,
  criarOcorrencia,
  encerrarOcorrencia,
  enviarAnexo,
  iniciarAtendimento,
  listarOcorrencias,
} from '../api/ocorrenciasApi'
import type {
  AtualizarOcorrenciaRequest,
  CriarOcorrenciaRequest,
  EncerrarOcorrenciaRequest,
  Ocorrencia,
  OcorrenciasFiltro,
  StatusProcesso,
} from '../types/ocorrencias.types'

function chaveDetalhe(id: string) {
  return ['ocorrencias', 'detalhe', id]
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

// As mutations que devolvem a ocorrência atualizada gravam essa resposta no
// cache do detalhe (é o estado que o backend acabou de gravar) e invalidam
// só as listagens.
function useAtualizarCacheDaOcorrencia() {
  const queryClient = useQueryClient()
  return (ocorrencia: Ocorrencia) => {
    queryClient.setQueryData(chaveDetalhe(ocorrencia.id), ocorrencia)
    void queryClient.invalidateQueries({ queryKey: ['ocorrencias', 'lista'] })
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
  const atualizarCache = useAtualizarCacheDaOcorrencia()
  return useMutation({
    mutationFn: (payload: AtualizarOcorrenciaRequest) => atualizarOcorrencia(id, payload),
    onSuccess: atualizarCache,
  })
}

export function useIniciarAtendimentoMutation(id: string) {
  const atualizarCache = useAtualizarCacheDaOcorrencia()
  return useMutation({
    mutationFn: () => iniciarAtendimento(id),
    onSuccess: atualizarCache,
  })
}

export function useEncerrarOcorrenciaMutation(id: string) {
  const atualizarCache = useAtualizarCacheDaOcorrencia()
  return useMutation({
    mutationFn: (payload: EncerrarOcorrenciaRequest) => encerrarOcorrencia(id, payload),
    onSuccess: atualizarCache,
  })
}

export function useAdicionarNotaMutation(id: string) {
  const atualizarCache = useAtualizarCacheDaOcorrencia()
  return useMutation({
    mutationFn: (descricao: string) => adicionarNota(id, descricao),
    onSuccess: atualizarCache,
  })
}

// Anexo e processo devolvem outro recurso: recarregam o detalhe da ocorrência.
export function useEnviarAnexoMutation(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (arquivo: File) => enviarAnexo(id, arquivo),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: chaveDetalhe(id) }),
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
