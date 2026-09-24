import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { buscarOcorrenciaPorId, encerrarOcorrencia } from './ocorrenciasApi'
import type { EncerrarOcorrenciaRequest } from './ocorrencias.types'

export function useOcorrenciaQuery(id: string | undefined) {
  return useQuery({
    queryKey: ['ocorrencias', 'detalhe', id],
    queryFn: () => buscarOcorrenciaPorId(id as string),
    enabled: Boolean(id),
  })
}

export function useEncerrarOcorrenciaMutation(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: EncerrarOcorrenciaRequest) => encerrarOcorrencia(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ocorrencias', 'detalhe', id] }),
  })
}
