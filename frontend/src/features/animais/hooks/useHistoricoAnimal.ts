import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  criarExame,
  criarPrescricao,
  criarProcedimento,
  criarVacinacao,
  listarExames,
  listarMedicamentosAtivos,
  listarPrescricoes,
  listarProcedimentos,
  listarVacinacoes,
} from '../api/historicoApi'
import type { CriarExameRequest, CriarPrescricaoRequest, CriarProcedimentoRequest, CriarVacinacaoRequest } from '../types/historico.types'

export const TAMANHO_PAGINA_HISTORICO = 20

export function chaveVacinacoes(animalId: string, pagina: number) {
  return ['vacinacoes', animalId, 'pagina', pagina] as const
}

export function chaveProcedimentos(animalId: string, pagina: number) {
  return ['procedimentos', animalId, 'pagina', pagina] as const
}

export function chavePrescricoes(animalId: string, pagina: number) {
  return ['prescricoes', animalId, 'pagina', pagina] as const
}

export function useVacinacoesQuery(animalId: string, pagina: number, tamanho: number = TAMANHO_PAGINA_HISTORICO) {
  return useQuery({
    queryKey: chaveVacinacoes(animalId, pagina),
    queryFn: () => listarVacinacoes(animalId, pagina, tamanho),
    enabled: Boolean(animalId),
    placeholderData: (dadosAnteriores) => dadosAnteriores,
  })
}

export function useProcedimentosQuery(animalId: string, pagina: number, tamanho: number = TAMANHO_PAGINA_HISTORICO) {
  return useQuery({
    queryKey: chaveProcedimentos(animalId, pagina),
    queryFn: () => listarProcedimentos(animalId, pagina, tamanho),
    enabled: Boolean(animalId),
    placeholderData: (dadosAnteriores) => dadosAnteriores,
  })
}

export function usePrescricoesQuery(animalId: string, pagina: number, tamanho: number = TAMANHO_PAGINA_HISTORICO) {
  return useQuery({
    queryKey: chavePrescricoes(animalId, pagina),
    queryFn: () => listarPrescricoes(animalId, pagina, tamanho),
    enabled: Boolean(animalId),
    placeholderData: (dadosAnteriores) => dadosAnteriores,
  })
}

function chaveExames(animalId: string, pagina: number) {
  return ['exames', animalId, 'pagina', pagina] as const
}

export function useExamesQuery(animalId: string, pagina: number, tamanho: number = TAMANHO_PAGINA_HISTORICO) {
  return useQuery({
    queryKey: chaveExames(animalId, pagina),
    queryFn: () => listarExames(animalId, pagina, tamanho),
    enabled: Boolean(animalId),
    placeholderData: (dadosAnteriores) => dadosAnteriores,
  })
}

export function useCriarExameMutation(animalId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CriarExameRequest) => criarExame(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['exames', animalId] }),
  })
}

export function useMedicamentosAtivosQuery() {
  return useQuery({
    queryKey: ['medicamentos', { ativo: true }],
    queryFn: listarMedicamentosAtivos,
    staleTime: Infinity,
  })
}

export function useCriarVacinacaoMutation(animalId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CriarVacinacaoRequest) => criarVacinacao(payload),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['vacinacoes', animalId] }),
        queryClient.invalidateQueries({ queryKey: ['alertas', 'vacinas'] }),
        queryClient.invalidateQueries({ queryKey: ['animais', 'detalhe', animalId] }),
      ]),
  })
}

export function useCriarProcedimentoMutation(animalId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CriarProcedimentoRequest) => criarProcedimento(payload),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['procedimentos', animalId] }),
        queryClient.invalidateQueries({ queryKey: ['animais', 'detalhe', animalId] }),
      ]),
  })
}

export function useCriarPrescricaoMutation(animalId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CriarPrescricaoRequest) => criarPrescricao(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['prescricoes', animalId] }),
  })
}
