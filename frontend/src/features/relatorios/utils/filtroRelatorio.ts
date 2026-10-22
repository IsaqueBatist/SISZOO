import type { FiltroRelatorio } from '../types/relatorios.types'

// Validação do lado do cliente antes de chamar a API — o backend
// (FiltroRelatorioResolver) valida de novo e é a fonte de verdade; isto só
// evita uma ida à rede com dado obviamente incompleto. null = filtro válido.
export function validarFiltro(filtro: FiltroRelatorio): string | null {
  if (filtro.ano != null) return null
  if (filtro.janela != null && filtro.janela !== 'custom') return null

  if (!filtro.periodoInicio || !filtro.periodoFim) {
    return 'Informe o período (data inicial e final).'
  }
  if (filtro.periodoInicio > filtro.periodoFim) {
    return 'A data final deve ser maior ou igual à data inicial.'
  }
  return null
}
