import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { atualizarTelefoneProprio, buscarPerfilProprio } from './perfilApi'

const PERFIL_QUERY_KEY = ['perfil', 'me']

export function usePerfilQuery() {
  return useQuery({ queryKey: PERFIL_QUERY_KEY, queryFn: buscarPerfilProprio })
}

export function useAtualizarTelefoneMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: atualizarTelefoneProprio,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PERFIL_QUERY_KEY }),
  })
}
