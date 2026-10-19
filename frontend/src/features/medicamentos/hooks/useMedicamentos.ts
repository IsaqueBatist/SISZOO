import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { criarCategoriaFarmacologica, criarMedicamento, listarCategoriasFarmacologicas } from '../api/medicamentosApi'

const CATEGORIAS_QUERY_KEY = ['categorias-farmacologicas']

export function useCategoriasFarmacologicasQuery() {
  return useQuery({
    queryKey: CATEGORIAS_QUERY_KEY,
    queryFn: listarCategoriasFarmacologicas,
  })
}

export function useCriarCategoriaFarmacologicaMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: criarCategoriaFarmacologica,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CATEGORIAS_QUERY_KEY }),
  })
}

// Invalida ['medicamentos'] inteiro: a lista desta tela e o select do modal
// de prescrição (useMedicamentosAtivosQuery) passam a ver o novo item.
export function useCriarMedicamentoMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: criarMedicamento,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['medicamentos'] }),
  })
}
