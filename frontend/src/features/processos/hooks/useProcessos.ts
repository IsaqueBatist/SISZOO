import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/hooks/useAuth'
import {
  anexarDocumento,
  buscarOcorrenciaParaVinculo,
  buscarProcessoPorId,
  concluirProcesso,
  criarProcesso,
  enviarAmostras,
  listarOcorrenciasParaVinculo,
  listarProcessos,
  registrarResultado,
  vincularExistentes,
} from '../api/processosApi'
import type {
  AnexarDocumentoRequest,
  CriarProcessoRequest,
  EnviarAmostrasRequest,
  ProcessosFiltro,
  RegistrarResultadoRequest,
} from '../types/processos.types'

const PROCESSOS_QUERY_KEY = ['processos']

export function useProcessosQuery(filtro: ProcessosFiltro) {
  const { roleKey } = useAuth()
  return useQuery({
    queryKey: ['processos', 'lista', filtro, roleKey],
    queryFn: () => listarProcessos(filtro, roleKey),
    placeholderData: (dadosAnteriores) => dadosAnteriores,
  })
}

export function useProcessoQuery(id: string | undefined) {
  const { roleKey } = useAuth()
  return useQuery({
    queryKey: ['processos', 'detalhe', id, roleKey],
    queryFn: () => buscarProcessoPorId(id as string, roleKey),
    enabled: Boolean(id),
  })
}

// Ocorrências de demonstração (D40) sob o prefixo [processos]: toda
// mutation de processo que muda vínculo já invalida esse prefixo.
export function useOcorrenciasParaVinculoQuery(busca: string | undefined) {
  const { roleKey } = useAuth()
  return useQuery({
    queryKey: ['processos', 'ocorrenciasDemonstracao', busca, roleKey],
    queryFn: () => listarOcorrenciasParaVinculo(busca, roleKey),
  })
}

export function useOcorrenciaParaVinculoQuery(id: string | undefined) {
  const { roleKey } = useAuth()
  return useQuery({
    queryKey: ['processos', 'ocorrenciaDemonstracao', id, roleKey],
    queryFn: () => buscarOcorrenciaParaVinculo(id as string, roleKey),
    enabled: Boolean(id),
  })
}

export function useCriarProcessoMutation() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: (payload: CriarProcessoRequest) => criarProcesso(payload, `${user?.nome} ${user?.sobrenome}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PROCESSOS_QUERY_KEY }),
  })
}

// Processos e ocorrências de demonstração vivem sob o mesmo prefixo (D40).
function invalidarProcessosEOcorrencias(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: PROCESSOS_QUERY_KEY })
}

export function useEnviarAmostrasMutation(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: EnviarAmostrasRequest) => enviarAmostras(id, payload),
    onSuccess: () => invalidarProcessosEOcorrencias(queryClient),
  })
}

export function useRegistrarResultadoMutation(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: RegistrarResultadoRequest) => registrarResultado(id, payload),
    onSuccess: () => invalidarProcessosEOcorrencias(queryClient),
  })
}

export function useConcluirProcessoMutation(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => concluirProcesso(id),
    onSuccess: () => invalidarProcessosEOcorrencias(queryClient),
  })
}

export function useAnexarDocumentoMutation(id: string) {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: (payload: AnexarDocumentoRequest) => anexarDocumento(id, payload, `${user?.nome} ${user?.sobrenome}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PROCESSOS_QUERY_KEY }),
  })
}

export function useVincularExistentesMutation(processoId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ocorrenciaId: string) => vincularExistentes(processoId, ocorrenciaId),
    onSuccess: () => invalidarProcessosEOcorrencias(queryClient),
  })
}
