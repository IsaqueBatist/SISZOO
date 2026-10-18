import { http } from '@/lib/http'
import type { PaginaResponse } from '@/features/usuarios/types/usuarios.types'
import type { Ocorrencia } from '@/features/ocorrencias/types/ocorrencias.types'
import type {
  CatalogosProcesso,
  CriarProcessoRequest,
  HistoricoProcessoItem,
  Processo,
  ProcessoResumo,
  ProcessosFiltro,
  RegistrarResultadoRequest,
  StatusProcesso,
} from '../types/processos.types'

// API real de processos sanitários (T29 + T37). Envio de amostras e
// documentos ainda não têm endpoint (task de documentos) e por isso não
// existem aqui.

export async function listarProcessos(filtro: ProcessosFiltro): Promise<PaginaResponse<ProcessoResumo>> {
  const { data } = await http.get<PaginaResponse<ProcessoResumo>>('/processos', {
    params: { doenca: filtro.doenca, status: filtro.status, pagina: filtro.pagina, tamanho: filtro.tamanho },
  })
  return data
}

export async function buscarProcessoPorId(id: string): Promise<Processo> {
  const { data } = await http.get<Processo>(`/processos/${id}`)
  return data
}

export async function buscarCatalogosProcesso(): Promise<CatalogosProcesso> {
  const { data } = await http.get<CatalogosProcesso>('/processos/catalogos')
  return data
}

export async function criarProcesso(payload: CriarProcessoRequest): Promise<Processo> {
  const { data } = await http.post<Processo>('/processos', payload)
  return data
}

// Provisório (D18): um passo por vez, sem resultado nem notificação.
export async function avancarStatusProcesso(id: string, status: StatusProcesso): Promise<Processo> {
  const { data } = await http.patch<Processo>(`/processos/${id}/status`, { status })
  return data
}

// Vínculo posterior (emenda 2026-10-03): o endpoint é o da ocorrência e exige
// OCORRENCIAS_DENUNCIAS:escrita (D33). Devolve a ocorrência atualizada.
export async function vincularOcorrencia(processoId: string, ocorrenciaId: string): Promise<Ocorrencia> {
  const { data } = await http.post<Ocorrencia>(`/ocorrencias/${ocorrenciaId}/processo`, { processoId })
  return data
}

// T37: substitui o avanço provisório só para AGUARDANDO_RESULTADO ->
// COM_RESULTADO — grava resultado, data e desfecho do animal numa vez
// (write-once no backend).
export async function registrarResultado(id: string, payload: RegistrarResultadoRequest): Promise<Processo> {
  const { data } = await http.post<Processo>(`/processos/${id}/resultado`, payload)
  return data
}

// T37: mini trilha de auditoria do processo (não a lista geral de
// auditoria, que exige USUARIOS_ACESSO:leitura — só Administrador).
export async function buscarHistoricoProcesso(id: string): Promise<HistoricoProcessoItem[]> {
  const { data } = await http.get<HistoricoProcessoItem[]>(`/processos/${id}/historico`)
  return data
}
