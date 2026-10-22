import { http } from '@/lib/http'
import { extrairNomeArquivo } from '@/lib/contentDisposition'
import type { PaginaResponse } from '@/features/usuarios/types/usuarios.types'
import type { FiltroRelatorio, RelatorioGeradoItem, TipoRelatorioInfo } from '../types/relatorios.types'

export async function listarTiposRelatorio(): Promise<TipoRelatorioInfo[]> {
  const { data } = await http.get<TipoRelatorioInfo[]>('/relatorios/tipos')
  return data
}

export async function previsualizarRelatorio<T>(filtro: FiltroRelatorio): Promise<T> {
  const { data } = await http.get<T>('/relatorios/preview', { params: filtro })
  return data
}

export interface ArquivoBaixado {
  blob: Blob
  nomeArquivo: string
}

export type FormatoRelatorio = 'csv' | 'pdf'

export async function exportarRelatorio(filtro: FiltroRelatorio, formato: FormatoRelatorio): Promise<ArquivoBaixado> {
  const resposta = await http.post('/relatorios/exportar', { ...filtro, formato }, { responseType: 'blob' })
  const nomeArquivo = extrairNomeArquivo(resposta.headers['content-disposition']) ?? `relatorio.${formato}`
  return { blob: resposta.data as Blob, nomeArquivo }
}

export async function listarHistoricoRelatorios(
  pagina: number,
  tamanho: number,
): Promise<PaginaResponse<RelatorioGeradoItem>> {
  const { data } = await http.get<PaginaResponse<RelatorioGeradoItem>>('/relatorios/historico', {
    params: { pagina, tamanho },
  })
  return data
}
