import { http } from '@/lib/http'
import type { DashboardKpis } from '../types/dashboard.types'

async function buscarKpisDashboard(): Promise<DashboardKpis> {
  const { data } = await http.get<DashboardKpis>('/dashboard/kpis')
  return data
}

export function kpisUsamMock(): boolean {
  return import.meta.env.VITE_USE_MOCK_KPIS === 'true'
}

export async function getKpisDashboard(): Promise<DashboardKpis> {
  if (import.meta.env.VITE_USE_MOCK_KPIS === 'true') {
    const { buscarKpisReaisMock } = await import('./dashboardApi.mock')
    return buscarKpisReaisMock()
  }
  return buscarKpisDashboard()
}
