import { http } from '@/lib/http'
import type { AlertaVacinalAnimal } from '../types/alertas.types'

export function listarAlertasVacinais(): Promise<AlertaVacinalAnimal[]> {
  return http.get<AlertaVacinalAnimal[]>('/alertas/vacinas').then((response) => response.data)
}
