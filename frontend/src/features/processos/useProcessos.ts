import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../auth/AuthContext'
import { criarProcesso } from './processosApi'
import type { CriarProcessoRequest } from './processos.types'

const PROCESSOS_QUERY_KEY = ['processos']
const OCORRENCIAS_QUERY_KEY = ['ocorrencias']

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
