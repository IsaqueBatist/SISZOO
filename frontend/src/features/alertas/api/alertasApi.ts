import { http } from '@/lib/http'
import type { AlertaEsterilizacaoAnimal, AlertaVacinalAnimal } from '../types/alertas.types'

export function listarAlertasVacinais(): Promise<AlertaVacinalAnimal[]> {
  return http.get<AlertaVacinalAnimal[]>('/alertas/vacinas').then((response) => response.data)
}

export function listarAlertasEsterilizacao(): Promise<AlertaEsterilizacaoAnimal[]> {
  return http.get<AlertaEsterilizacaoAnimal[]>('/alertas/esterilizacao').then((response) => response.data)
}
