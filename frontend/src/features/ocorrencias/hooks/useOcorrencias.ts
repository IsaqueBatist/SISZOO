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
  QuantidadePorBairro,
  StatusProcesso,
} from '../types/ocorrencias.types'

function chaveDetalhe(id: string) {
  return ['ocorrencias', 'detalhe', id]
}

const CHAVE_ESTATISTICAS = ['ocorrencias', 'estatisticas']

// T45: gráfico de distribuição e sugestões de bairro leem a mesma contagem
// (mesma chave, uma requisição só, cada um com o próprio `select`). Criar ou
// editar ocorrência invalida a contagem (useAtualizarCacheDaOcorrencia e
// useRecarregarOcorrencia); o staleTime só segura o refetch a cada montagem.
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

// O cadastro grava a resposta no cache do detalhe (é o estado que o backend
// acabou de gravar) e invalida só as listagens e a contagem por bairro.
function useAtualizarCacheDaOcorrencia() {
  const queryClient = useQueryClient()
  return (ocorrencia: Ocorrencia) => {
    queryClient.setQueryData(chaveDetalhe(ocorrencia.id), ocorrencia)
    void queryClient.invalidateQueries({ queryKey: ['ocorrencias', 'lista'] })
    void queryClient.invalidateQueries({ queryKey: CHAVE_ESTATISTICAS })
  }
}

// Edição, status, encerramento e nota devolvem o denunciante de ocorrência
// sigilosa sempre mascarado (A04): a resposta não pode ir para o cache do
// detalhe, ou quem tem acesso veria o bloco vazio. O detalhe é recarregado
// pelo GET, que entrega o dado a quem tem a permissão e registra o acesso.
function useRecarregarOcorrencia(id: string) {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: ['ocorrencias', 'lista'] })
    void queryClient.invalidateQueries({ queryKey: CHAVE_ESTATISTICAS })
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
