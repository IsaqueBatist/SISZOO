import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { alterarStatusUsuario, atualizarUsuario, criarUsuario, listarUsuarios, redefinirSenhaUsuario } from '../api/usuariosApi'
import type { AtualizarUsuarioRequest } from '../types/usuarios.types'

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

export function useAtualizarUsuarioMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AtualizarUsuarioRequest }) => atualizarUsuario(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: USUARIOS_QUERY_KEY }),
  })
}

export function useRedefinirSenhaMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, senhaTemporaria }: { id: string; senhaTemporaria: string }) => redefinirSenhaUsuario(id, senhaTemporaria),
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
