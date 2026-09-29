import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../auth/AuthContext'
import { buscarProcessoPorId, criarProcesso, listarProcessos } from './processosApi'
import type { CriarProcessoRequest, ProcessosFiltro } from './processos.types'

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
