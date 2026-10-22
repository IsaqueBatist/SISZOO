import { useMutation, useQuery } from '@tanstack/react-query'
import {
  exportarRelatorio,
  listarHistoricoRelatorios,
  listarTiposRelatorio,
  previsualizarRelatorio,
  type FormatoRelatorio,
} from '../api/relatoriosApi'
import type { FiltroRelatorio } from '../types/relatorios.types'

export function useTiposRelatorioQuery() {
  return useQuery({ queryKey: ['relatorios', 'tipos'], queryFn: listarTiposRelatorio, staleTime: Infinity })
}

// `filtro` nulo (nenhum "Gerar Relatório" clicado ainda) desabilita a query —
// não há tela de relatório sem um tipo+período escolhido pelo usuário.
export function usePreviewRelatorioQuery<T>(filtro: FiltroRelatorio | null) {
  return useQuery({
    queryKey: ['relatorios', 'preview', filtro],
    queryFn: () => previsualizarRelatorio<T>(filtro as FiltroRelatorio),
    enabled: filtro !== null,
  })
}

export function useExportarRelatorioMutation() {
  return useMutation({
    mutationFn: ({ filtro, formato }: { filtro: FiltroRelatorio; formato: FormatoRelatorio }) =>
      exportarRelatorio(filtro, formato),
  })
}

export function useHistoricoRelatoriosQuery(pagina: number, tamanho: number) {
  return useQuery({
    queryKey: ['relatorios', 'historico', pagina, tamanho],
    queryFn: () => listarHistoricoRelatorios(pagina, tamanho),
  })
}
