import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { atualizarPreferencias, buscarPreferencias } from './configuracoesApi'

export const PREFERENCIAS_QUERY_KEY = ['preferencias', 'me']

export function usePreferenciasQuery() {
  return useQuery({ queryKey: PREFERENCIAS_QUERY_KEY, queryFn: buscarPreferencias })
}

export function useAtualizarPreferenciasMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: atualizarPreferencias,
    onSuccess: (data) => queryClient.setQueryData(PREFERENCIAS_QUERY_KEY, data),
  })
}
