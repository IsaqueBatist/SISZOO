import { http } from '@/lib/http'
import type { DashboardKpis, DashboardKpisApi } from '../types/dashboard.types'

export async function buscarKpisDashboard(): Promise<DashboardKpisApi> {
  const { data } = await http.get<DashboardKpisApi>('/dashboard/kpis')
  return data
}

// Lido pela UI (Dashboard.tsx) para decidir se mostra o selo "Dados de
// demonstração" no card de animais/vacinação/ocorrências/alertas. É uma
// função (não uma constante congelada no import) de propósito: assim
// `vi.stubEnv` nos testes troca o comportamento sem precisar de
// `vi.resetModules()` (que arriscaria duplicar a instância do React no mesmo
// arquivo de teste). Não é usada para decidir o import() dinâmico do mock —
// ver `buscarKpisReaisOuMock` abaixo, que mantém a condição literal.
export function kpisUsamMock(): boolean {
  return import.meta.env.VITE_USE_MOCK_KPIS !== 'false'
}

async function buscarKpisReaisOuMock(): Promise<DashboardKpisApi> {
  // Condição literal e INLINE (não uma constante/função importada): é o que
  // permite ao Rollup podar o chunk de dashboardApi.mock.ts do bundle de
  // produção quando a flag é 'false' em build time.
  if (import.meta.env.VITE_USE_MOCK_KPIS !== 'false') {
    const { buscarKpisReaisMock } = await import('./dashboardApi.mock')
    return buscarKpisReaisMock()
  }
  return buscarKpisDashboard()
}

// Sempre mock: GET /api/dashboard/kpis não devolve "adocoes" (sem fonte de
// dado no backend — ver dashboard.types.ts::KpiAdocoes). Diferente de
// kpisUsamMock, não depende de env var: não existe variante real para
// alternar ainda.
async function buscarAdocoes() {
  const { buscarAdocoesMock } = await import('./dashboardApi.mock')
  return buscarAdocoesMock()
}

export async function getKpisDashboard(): Promise<DashboardKpis> {
  const [reais, adocoes] = await Promise.all([buscarKpisReaisOuMock(), buscarAdocoes()])
  return { ...reais, adocoes }
}
