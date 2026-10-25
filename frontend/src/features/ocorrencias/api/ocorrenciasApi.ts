import { http } from '@/lib/http'
import type { PaginaResponse } from '@/features/usuarios/types/usuarios.types'
import type {
  AnexoOcorrencia,
  AtualizarOcorrenciaRequest,
  CatalogosOcorrencia,
  CriarOcorrenciaRequest,
  EncerrarOcorrenciaRequest,
  Ocorrencia,
  OcorrenciaResumo,
  OcorrenciasFiltro,
  ProcessoSanitario,
  QuantidadePorBairro,
  StatusProcesso,
} from '../types/ocorrencias.types'

// API real de ocorrências (T25). Sem perfil no front: sigilo e permissões
// são decididos pelo backend, que devolve `podeVerDenunciante` e responde
// 403/422 quando a ação não é permitida.

export async function listarOcorrencias(filtro: OcorrenciasFiltro): Promise<PaginaResponse<OcorrenciaResumo>> {
  const { data } = await http.get<PaginaResponse<OcorrenciaResumo>>('/ocorrencias', {
    params: {
      tipo: filtro.tipo,
      status: filtro.status,
      q: filtro.q,
      de: filtro.de,
      ate: filtro.ate,
      pagina: filtro.pagina,
      tamanho: filtro.tamanho,
    },
  })
  return data
}

// T45: contagem por bairro de todo o histórico, para o gráfico e as sugestões
// de bairro (antes, 500 ocorrências baixadas só para contar no cliente).
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

// D5: por este endpoint só ABERTA -> EM_ATENDIMENTO.
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

// O download precisa do token (não dá para usar um <a href> direto): baixa o
// conteúdo como Blob e quem chama cria e revoga o object URL.
export async function baixarAnexo(id: string, anexoId: string): Promise<Blob> {
  const { data } = await http.get<Blob>(`/ocorrencias/${id}/anexos/${anexoId}`, { responseType: 'blob' })
  return data
}

// D40: o status do processo vinculado é avançado pela tela da ocorrência. A
// abertura do processo saiu daqui na T29 (o backend passou a exigir o processo
// completo) e volta pelo wizard de processos (T32/T33).
export async function avancarStatusProcesso(processoId: string, status: StatusProcesso): Promise<ProcessoSanitario> {
  const { data } = await http.patch<ProcessoSanitario>(`/processos/${processoId}/status`, { status })
  return data
}
