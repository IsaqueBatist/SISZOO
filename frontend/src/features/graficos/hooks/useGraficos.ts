import { useQuery } from '@tanstack/react-query'
import { getGraficos } from '../api/graficosApi'

export function useGraficosQuery(ano: number = new Date().getFullYear()) {
  return useQuery({
    queryKey: ['dashboard', 'graficos', ano],
    queryFn: () => getGraficos(ano),
  })
}
