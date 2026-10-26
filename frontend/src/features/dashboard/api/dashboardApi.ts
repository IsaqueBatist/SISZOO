import { http } from '@/lib/http'
import type { DashboardKpis } from '../types/dashboard.types'

export async function buscarKpisDashboard(): Promise<DashboardKpis> {
  const { data } = await http.get<DashboardKpis>('/dashboard/kpis')
  return data
}

// Lido pela UI (Dashboard.tsx) para decidir se mostra o selo "Dados de
// demonstração" nos cards de KPI e no painel de alertas. É uma
// função (não uma constante congelada no import) de propósito: assim
// `vi.stubEnv` nos testes troca o comportamento sem precisar de
// `vi.resetModules()` (que arriscaria duplicar a instância do React no mesmo
// arquivo de teste). Não é usada para decidir o import() dinâmico do mock —
// ver `buscarKpisReaisOuMock` abaixo, que mantém a condição literal.
export function kpisUsamMock(): boolean {
  return import.meta.env.VITE_USE_MOCK_KPIS === 'true'
}

export async function getKpisDashboard(): Promise<DashboardKpis> {
  // Condição literal e INLINE (não uma constante/função importada): é o que
  // permite ao Rollup podar o chunk de dashboardApi.mock.ts do bundle de
  // produção quando a flag não é 'true' em build time. Ausente = dados reais.
  if (import.meta.env.VITE_USE_MOCK_KPIS === 'true') {
    const { buscarKpisReaisMock } = await import('./dashboardApi.mock')
    return buscarKpisReaisMock()
  }
  return buscarKpisDashboard()
}
