import { http } from '@/lib/http'
import type { PaginaResponse } from '@/features/usuarios/types/usuarios.types'
import type { Ocorrencia } from '@/features/ocorrencias/types/ocorrencias.types'
import type { EventoAuditoria } from '@/features/auditoria/types/auditoria.types'
import type {
  CatalogosProcesso,
  CriarProcessoRequest,
  EditarProcessoRequest,
  Processo,
  ProcessoResumo,
  ProcessosFiltro,
  RegistrarResultadoRequest,
  StatusProcesso,
} from '../types/processos.types'

// API real de processos sanitários. Envio de amostras e documentos ainda não
// têm endpoint e por isso não existem aqui.

export async function listarProcessos(filtro: ProcessosFiltro): Promise<PaginaResponse<ProcessoResumo>> {
  const { data } = await http.get<PaginaResponse<ProcessoResumo>>('/processos', {
    params: {
      doenca: filtro.doenca,
      status: Array.isArray(filtro.status) ? filtro.status.join(',') : filtro.status,
      urgente: filtro.urgente,
      q: filtro.q,
      de: filtro.de,
      ate: filtro.ate,
      pagina: filtro.pagina,
      tamanho: filtro.tamanho,
    },
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

export async function editarProcesso(id: string, payload: EditarProcessoRequest): Promise<Processo> {
  const { data } = await http.put<Processo>(`/processos/${id}`, payload)
  return data
}

export async function listarAlteracoesProcesso(id: string): Promise<EventoAuditoria[]> {
  const { data } = await http.get<EventoAuditoria[]>(`/processos/${id}/alteracoes`)
  return data
}

// Provisório: um passo por vez, sem resultado nem notificação.
export async function avancarStatusProcesso(id: string, status: StatusProcesso): Promise<Processo> {
  const { data } = await http.patch<Processo>(`/processos/${id}/status`, { status })
  return data
}

// Vínculo posterior: o endpoint é o da ocorrência e exige
// OCORRENCIAS_DENUNCIAS:escrita. Devolve a ocorrência atualizada.
export async function vincularOcorrencia(processoId: string, ocorrenciaId: string): Promise<Ocorrencia> {
  const { data } = await http.post<Ocorrencia>(`/ocorrencias/${ocorrenciaId}/processo`, { processoId })
  return data
}

// Substitui o avanço provisório só para AGUARDANDO_RESULTADO ->
// COM_RESULTADO: grava resultado, data e desfecho do animal. Sem
// retificaId é o primeiro lançamento (write-once); com ele, corrige o
// resultado vigente (histórico completo embutido na resposta, campo
// `resultados`).
export async function registrarResultado(id: string, payload: RegistrarResultadoRequest): Promise<Processo> {
  const { data } = await http.post<Processo>(`/processos/${id}/resultados`, payload)
  return data
}

// Reenvio manual da notificação ao munícipe quando o
// primeiro envio falhou. O backend recusa (422) sem resultado notificável
// vigente ou com a notificação já confirmada pelo SMTP.
export async function reenviarNotificacaoMunicipe(id: string): Promise<Processo> {
  const { data } = await http.post<Processo>(`/processos/${id}/notificacoes/reenviar`)
  return data
}
