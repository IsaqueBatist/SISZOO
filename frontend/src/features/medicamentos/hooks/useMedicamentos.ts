import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  atualizarMedicamento,
  criarCategoriaFarmacologica,
  criarMedicamento,
  desativarMedicamento,
  listarCategoriasFarmacologicas,
  listarMedicamentos,
  type AtualizarMedicamentoRequest,
} from '../api/medicamentosApi'

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

// Catálogo completo (ativos e inativos) para a tela de gerenciamento. A tela
// filtra em memória: a faixa de resumo precisa do conjunto inteiro de
// qualquer jeito.
export function useMedicamentosQuery() {
  return useQuery({
    queryKey: ['medicamentos', 'catalogo'],
    queryFn: () => listarMedicamentos(),
    select: (pagina) => pagina.itens,
  })
}

// Como em useCriarMedicamentoMutation, invalida ['medicamentos'] inteiro: sem
// isso o select do modal de prescrição (useMedicamentosAtivosQuery, que tem
// staleTime Infinity) continuaria mostrando o nome antigo ou um medicamento
// já desativado.
function useInvalidarMedicamentos() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['medicamentos'] })
}

export function useAtualizarMedicamentoMutation() {
  const invalidar = useInvalidarMedicamentos()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AtualizarMedicamentoRequest }) =>
      atualizarMedicamento(id, payload),
    onSuccess: invalidar,
  })
}

export function useDesativarMedicamentoMutation() {
  const invalidar = useInvalidarMedicamentos()
  return useMutation({ mutationFn: desativarMedicamento, onSuccess: invalidar })
}
