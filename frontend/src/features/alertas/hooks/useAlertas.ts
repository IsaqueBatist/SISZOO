import { useQuery } from '@tanstack/react-query'
import { listarAlertasVacinais } from '../api/alertasApi'

export function useAlertasVacinaisQuery() {
  return useQuery({
    queryKey: ['alertas', 'vacinas'],
    queryFn: listarAlertasVacinais,
  })
}
