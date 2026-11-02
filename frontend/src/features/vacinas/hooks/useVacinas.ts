import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { atualizarVacina, criarVacina, desativarVacina, listarVacinas } from '../api/vacinasApi'
import type { AtualizarVacinaRequest } from '../types/vacinas.types'

const VACINAS_QUERY_KEY = ['vacinas']

export function useVacinasQuery(incluirInativas: boolean) {
  return useQuery({
    queryKey: [...VACINAS_QUERY_KEY, { ativo: incluirInativas ? undefined : true }],
    queryFn: () => listarVacinas(incluirInativas ? undefined : true),
    select: (pagina) => pagina.itens,
  })
}

function useInvalidarVacinas() {
  const queryClient = useQueryClient()
  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: VACINAS_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: ['animais', 'catalogos'] }),
    ])
  }
}

export function useCriarVacinaMutation() {
  const invalidar = useInvalidarVacinas()
  return useMutation({ mutationFn: criarVacina, onSuccess: invalidar })
}

export function useAtualizarVacinaMutation() {
  const invalidar = useInvalidarVacinas()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AtualizarVacinaRequest }) => atualizarVacina(id, payload),
    onSuccess: invalidar,
  })
}

export function useDesativarVacinaMutation() {
  const invalidar = useInvalidarVacinas()
  return useMutation({ mutationFn: desativarVacina, onSuccess: invalidar })
}
