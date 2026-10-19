import { useQuery } from '@tanstack/react-query'
import { getKpisDashboard } from '../api/dashboardApi'

export function useKpisDashboardQuery() {
  return useQuery({
    queryKey: ['dashboard', 'kpis'],
    queryFn: getKpisDashboard,
  })
}
