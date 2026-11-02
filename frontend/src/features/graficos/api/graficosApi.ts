import { http } from '@/lib/http'
import type { DashboardGraficos } from '../types/graficos.types'

async function buscarGraficosDashboard(ano: number): Promise<DashboardGraficos> {
  const { data } = await http.get<DashboardGraficos>('/dashboard/graficos', { params: { ano } })
  return data
}

export function graficosUsamMock(): boolean {
  return import.meta.env.VITE_USE_MOCK_GRAFICOS === 'true'
}

export async function getGraficos(ano: number): Promise<DashboardGraficos> {
  if (import.meta.env.VITE_USE_MOCK_GRAFICOS === 'true') {
    const { getGraficosMock } = await import('./graficosApi.mock')
    return getGraficosMock()
  }
  return buscarGraficosDashboard(ano)
}
