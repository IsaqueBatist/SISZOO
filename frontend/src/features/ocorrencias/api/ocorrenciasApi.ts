import { http } from '@/lib/http'
import type { PaginaResponse } from '@/features/usuarios/types/usuarios.types'
import type {
  AnexoOcorrencia,
  AtualizarOcorrenciaRequest,
  CatalogosOcorrencia,
  CriarOcorrenciaRequest,
  EncerrarOcorrenciaRequest,
  Ocorrencia,
  OrigemAnimal,
  OcorrenciaResumo,
  OcorrenciasFiltro,
  ProcessoSanitario,
  QuantidadePorBairro,
  StatusProcesso,
} from '../types/ocorrencias.types'

export async function listarOcorrencias(
  filtro: OcorrenciasFiltro,
  signal?: AbortSignal,
): Promise<PaginaResponse<OcorrenciaResumo>> {
  const { data } = await http.get<PaginaResponse<OcorrenciaResumo>>('/ocorrencias', {
    signal,
    params: {
      tipo: filtro.tipo,
      status: Array.isArray(filtro.status) ? filtro.status.join(',') : filtro.status,
      q: filtro.q,
      de: filtro.de,
      ate: filtro.ate,
      pagina: filtro.pagina,
      tamanho: filtro.tamanho,
    },
  })
  return data
}

export async function contarOcorrenciasPorBairro(): Promise<QuantidadePorBairro[]> {
  const { data } = await http.get<QuantidadePorBairro[]>('/ocorrencias/estatisticas/bairro')
  return data
}

export async function buscarOcorrenciaPorId(id: string): Promise<Ocorrencia> {
  const { data } = await http.get<Ocorrencia>(`/ocorrencias/${id}`)
  return data
}

export async function buscarCatalogosOcorrencia(): Promise<CatalogosOcorrencia> {
  const { data } = await http.get<CatalogosOcorrencia>('/ocorrencias/catalogos')
  return data
}

export async function criarOcorrencia(payload: CriarOcorrenciaRequest): Promise<Ocorrencia> {
  const { data } = await http.post<Ocorrencia>('/ocorrencias', payload)
  return data
}

export async function atualizarOcorrencia(id: string, payload: AtualizarOcorrenciaRequest): Promise<Ocorrencia> {
  const { data } = await http.put<Ocorrencia>(`/ocorrencias/${id}`, payload)
  return data
}

export async function iniciarAtendimento(id: string): Promise<Ocorrencia> {
  const { data } = await http.patch<Ocorrencia>(`/ocorrencias/${id}/status`, { status: 'EM_ATENDIMENTO' })
  return data
}

export async function encerrarOcorrencia(id: string, payload: EncerrarOcorrenciaRequest): Promise<Ocorrencia> {
  const { data } = await http.post<Ocorrencia>(`/ocorrencias/${id}/encerramento`, payload)
  return data
}

export async function adicionarNota(id: string, descricao: string): Promise<Ocorrencia> {
  const { data } = await http.post<Ocorrencia>(`/ocorrencias/${id}/notas`, { descricao })
  return data
}

export async function enviarAnexo(id: string, arquivo: File): Promise<AnexoOcorrencia> {
  const formulario = new FormData()
  formulario.append('arquivo', arquivo)
  const { data } = await http.post<AnexoOcorrencia>(`/ocorrencias/${id}/anexos`, formulario)
  return data
}

export async function baixarAnexo(id: string, anexoId: string): Promise<Blob> {
  const { data } = await http.get<Blob>(`/ocorrencias/${id}/anexos/${anexoId}`, { responseType: 'blob' })
  return data
}

export async function avancarStatusProcesso(processoId: string, status: StatusProcesso): Promise<ProcessoSanitario> {
  const { data } = await http.patch<ProcessoSanitario>(`/processos/${processoId}/status`, { status })
  return data
}

export async function vincularAnimal(id: string, animalId: string): Promise<Ocorrencia> {
  const { data } = await http.put<Ocorrencia>(`/ocorrencias/${id}/animal`, { animalId })
  return data
}

export async function listarOrigemDoAnimal(animalId: string): Promise<OrigemAnimal[]> {
  const { data } = await http.get<OrigemAnimal[]>(`/animais/${animalId}/origem`)
  return data
}
