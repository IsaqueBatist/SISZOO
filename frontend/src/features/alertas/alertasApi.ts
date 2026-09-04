import { http } from '../../lib/http'
import type { AlertaVacinalAnimal } from './alertas.types'

export function listarAlertasVacinais(): Promise<AlertaVacinalAnimal[]> {
  return http.get<AlertaVacinalAnimal[]>('/alertas/vacinas').then((response) => response.data)
}
