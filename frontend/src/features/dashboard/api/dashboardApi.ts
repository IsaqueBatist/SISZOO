import { http } from '@/lib/http'
import type { DashboardKpis } from '../types/dashboard.types'

export async function buscarKpisDashboard(): Promise<DashboardKpis> {
  const { data } = await http.get<DashboardKpis>('/dashboard/kpis')
  return data
}

// Lido pela UI (Dashboard.tsx) para decidir se mostra o selo "Dados de
// demonstração". É uma função (não uma constante congelada no import) de
// propósito: assim `vi.stubEnv` nos testes troca o comportamento sem precisar
// de `vi.resetModules()` (que arriscaria duplicar a instância do React no
// mesmo arquivo de teste). Não é usada para decidir o import() dinâmico do
// mock — ver `getKpisDashboard` abaixo, que mantém a condição literal.
export function kpisUsamMock(): boolean {
  return import.meta.env.VITE_USE_MOCK_KPIS !== 'false'
}

export async function getKpisDashboard(): Promise<DashboardKpis> {
  // Condição literal e INLINE (não uma constante/função importada): é o que
  // permite ao Rollup podar o chunk de dashboardApi.mock.ts do bundle de
  // produção quando a flag é 'false' em build time. Verificado em
  // "Verificação" (build com a flag off + grep em dist/ pela fixture).
  if (import.meta.env.VITE_USE_MOCK_KPIS !== 'false') {
    const { buscarKpisDashboardMock } = await import('./dashboardApi.mock')
    return buscarKpisDashboardMock()
  }
  return buscarKpisDashboard()
}
