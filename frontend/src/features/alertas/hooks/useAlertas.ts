import { useQuery } from '@tanstack/react-query'
import { listarAlertasEsterilizacao, listarAlertasVacinais } from '../api/alertasApi'

export function useAlertasVacinaisQuery(habilitada = true) {
  return useQuery({
    queryKey: ['alertas', 'vacinas'],
    queryFn: listarAlertasVacinais,
    enabled: habilitada,
  })
}

export function useAlertasEsterilizacaoQuery(habilitada = true) {
  return useQuery({
    queryKey: ['alertas', 'esterilizacao'],
    queryFn: listarAlertasEsterilizacao,
    enabled: habilitada,
  })
}
