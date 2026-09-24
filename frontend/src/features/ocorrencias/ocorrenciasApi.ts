import { http } from '../../lib/http'
import type { EncerrarOcorrenciaRequest, Ocorrencia } from './ocorrencias.types'

export function buscarOcorrenciaPorId(id: string): Promise<Ocorrencia> {
  return http.get<Ocorrencia>(`/ocorrencias/${id}`).then((response) => response.data)
}

export function encerrarOcorrencia(id: string, payload: EncerrarOcorrenciaRequest): Promise<Ocorrencia> {
  return http.patch<Ocorrencia>(`/ocorrencias/${id}/encerrar`, payload).then((response) => response.data)
}
