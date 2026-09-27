import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../auth/AuthContext'
import { buscarOcorrenciaPorId, criarOcorrencia, encerrarOcorrencia, listarOcorrencias } from './ocorrenciasApi'
import type { CriarOcorrenciaRequest, EncerrarOcorrenciaRequest, OcorrenciasFiltro } from './ocorrencias.types'

const OCORRENCIAS_QUERY_KEY = ['ocorrencias']

export function useOcorrenciasQuery(filtro: OcorrenciasFiltro) {
  const { roleKey } = useAuth()
  return useQuery({
    queryKey: ['ocorrencias', 'lista', filtro, roleKey],
    queryFn: () => listarOcorrencias(filtro, roleKey),
    placeholderData: (dadosAnteriores) => dadosAnteriores,
  })
}

export function useOcorrenciaQuery(id: string | undefined) {
  const { roleKey } = useAuth()
  return useQuery({
    queryKey: ['ocorrencias', 'detalhe', id, roleKey],
    queryFn: () => buscarOcorrenciaPorId(id as string, roleKey),
    enabled: Boolean(id),
  })
}

export function useCriarOcorrenciaMutation() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: (payload: CriarOcorrenciaRequest) => criarOcorrencia(payload, `${user?.nome} ${user?.sobrenome}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: OCORRENCIAS_QUERY_KEY }),
  })
}

export function useEncerrarOcorrenciaMutation(id: string) {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: (payload: EncerrarOcorrenciaRequest) => encerrarOcorrencia(id, payload, `${user?.nome} ${user?.sobrenome}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: OCORRENCIAS_QUERY_KEY }),
  })
}
