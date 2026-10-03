import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/hooks/AuthContext'
import {
  anexarDocumento,
  buscarProcessoPorId,
  concluirProcesso,
  criarProcesso,
  enviarAmostras,
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
const OCORRENCIAS_QUERY_KEY = ['ocorrencias']

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

export function useCriarProcessoMutation() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: (payload: CriarProcessoRequest) => criarProcesso(payload, `${user?.nome} ${user?.sobrenome}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROCESSOS_QUERY_KEY })
      // O processo criado pode ter alterado `processoVinculado` da
      // ocorrência (ver processosMockStore::criarProcessoMock) — invalida
      // também as queries de ocorrências para refletir isso na tela de
      // detalhe (badge de urgência, regra 13).
      queryClient.invalidateQueries({ queryKey: OCORRENCIAS_QUERY_KEY })
    },
  })
}

// Invalida ambos os prefixos em todas as mutations abaixo: cada uma pode
// repassar status/resultado pro lado da ocorrência vinculada (ver
// processosMockStore::sincronizarVinculoNaOcorrencia) ou criar/remover o
// vínculo em si — mesmo motivo de useCriarProcessoMutation acima.
function invalidarProcessosEOcorrencias(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: PROCESSOS_QUERY_KEY })
  queryClient.invalidateQueries({ queryKey: OCORRENCIAS_QUERY_KEY })
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
