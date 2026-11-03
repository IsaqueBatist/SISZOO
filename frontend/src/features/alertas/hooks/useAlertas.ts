import { useQuery } from '@tanstack/react-query'
import { listarAlertasEsterilizacao, listarAlertasVacinais } from '../api/alertasApi'

export function useAlertasVacinaisQuery() {
  return useQuery({
    queryKey: ['alertas', 'vacinas'],
    queryFn: listarAlertasVacinais,
  })
}

export function useAlertasEsterilizacaoQuery() {
  return useQuery({
    queryKey: ['alertas', 'esterilizacao'],
    queryFn: listarAlertasEsterilizacao,
  })
}
