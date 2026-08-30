import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { alterarStatusUsuario, criarUsuario, listarUsuarios } from './usuariosApi'

const USUARIOS_QUERY_KEY = ['usuarios']

export function useUsuariosQuery() {
  return useQuery({ queryKey: USUARIOS_QUERY_KEY, queryFn: listarUsuarios })
}

export function useCriarUsuarioMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: criarUsuario,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: USUARIOS_QUERY_KEY }),
  })
}

export function useAlterarStatusUsuarioMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ativo }: { id: string; ativo: boolean }) => alterarStatusUsuario(id, ativo),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: USUARIOS_QUERY_KEY }),
  })
}
