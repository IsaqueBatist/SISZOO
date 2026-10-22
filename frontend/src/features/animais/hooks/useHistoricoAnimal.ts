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

// Tamanho de página padrão das abas Vacinas/Procedimentos/Medicamentos —
// também usado pelo merge k-way de `useTimelineAnimal` para reaproveitar as
// mesmas query keys (e, portanto, o mesmo cache).
export const TAMANHO_PAGINA_HISTORICO = 20

// Chaves em array — o prefixo `['vacinacoes', animalId]` é compartilhado
// entre a query paginada da aba e a leitura avulsa feita pelo merge da
// timeline, então uma única invalidação (nas mutations abaixo) alcança as
// duas sem precisar de coordenação manual.
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

// F2-007 / RF-A04
export function chaveExames(animalId: string, pagina: number) {
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
    // Também os alertas de vacina (a aplicação nova pode tirar o animal da
    // lista) e o detalhe do animal (ficha_completa é recalculada no backend).
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['procedimentos', animalId] }),
  })
}

export function useCriarPrescricaoMutation(animalId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CriarPrescricaoRequest) => criarPrescricao(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['prescricoes', animalId] }),
  })
}
