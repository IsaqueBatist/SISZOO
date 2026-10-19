import { http } from '@/lib/http'
import type { DashboardGraficos } from '../types/graficos.types'

export async function buscarGraficosDashboard(ano: number): Promise<DashboardGraficos> {
  const { data } = await http.get<DashboardGraficos>('/dashboard/graficos', { params: { ano } })
  return data
}

// Lido pela UI (GraficosDashboard.tsx) para decidir se mostra o selo "Dados
// de demonstração" nos cards "Casos Suspeitos" e "Resultados Laboratoriais"
// (nunca em "Ocupação por Baia", que é real). É uma função (não uma
// constante congelada no import) de propósito — mesmo motivo de
// features/dashboard/api/dashboardApi.ts::kpisUsamMock: `vi.stubEnv` nos
// testes troca o comportamento sem precisar de `vi.resetModules()`.
export function graficosUsamMock(): boolean {
  return import.meta.env.VITE_USE_MOCK_GRAFICOS !== 'false'
}

export async function getGraficos(ano: number): Promise<DashboardGraficos> {
  // Condição literal e INLINE (não uma constante/função importada): é o que
  // permite ao Rollup podar o chunk de graficosApi.mock.ts do bundle de
  // produção quando a flag é 'false' em build time.
  if (import.meta.env.VITE_USE_MOCK_GRAFICOS !== 'false') {
    const { getGraficosMock } = await import('./graficosApi.mock')
    return getGraficosMock()
  }
  return buscarGraficosDashboard(ano)
}
