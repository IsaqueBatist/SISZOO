import { http } from '../../lib/http'
import type { PaginaResponse } from '../usuarios/usuarios.types'
import type {
  CriarPrescricaoRequest,
  CriarProcedimentoRequest,
  CriarVacinacaoRequest,
  Medicamento,
  Prescricao,
  Procedimento,
  Vacinacao,
} from './historico.types'

export function listarVacinacoes(animalId: string, pagina: number, tamanho: number): Promise<PaginaResponse<Vacinacao>> {
  return http
    .get<PaginaResponse<Vacinacao>>('/vacinacoes', { params: { animalId, pagina, tamanho } })
    .then((response) => response.data)
}

export function criarVacinacao(payload: CriarVacinacaoRequest): Promise<Vacinacao> {
  return http.post<Vacinacao>('/vacinacoes', payload).then((response) => response.data)
}

export function listarProcedimentos(animalId: string, pagina: number, tamanho: number): Promise<PaginaResponse<Procedimento>> {
  return http
    .get<PaginaResponse<Procedimento>>('/procedimentos', { params: { animalId, pagina, tamanho } })
    .then((response) => response.data)
}

export function criarProcedimento(payload: CriarProcedimentoRequest): Promise<Procedimento> {
  return http.post<Procedimento>('/procedimentos', payload).then((response) => response.data)
}

export function listarPrescricoes(animalId: string, pagina: number, tamanho: number): Promise<PaginaResponse<Prescricao>> {
  return http
    .get<PaginaResponse<Prescricao>>('/prescricoes', { params: { animalId, pagina, tamanho } })
    .then((response) => response.data)
}

export function criarPrescricao(payload: CriarPrescricaoRequest): Promise<Prescricao> {
  return http.post<Prescricao>('/prescricoes', payload).then((response) => response.data)
}

// Só medicamentos ativos: são os únicos que fazem sentido oferecer numa
// nova prescrição. Tamanho grande o bastante para cobrir o catálogo inteiro
// sem paginação própria (mesmo padrão de `listarBaiasAtivas` em animaisApi.ts).
const TAMANHO_PAGINA_SEM_UI_DE_PAGINACAO = 100

export function listarMedicamentosAtivos(): Promise<Medicamento[]> {
  return http
    .get<PaginaResponse<Medicamento>>('/medicamentos', {
      params: { ativo: true, pagina: 0, tamanho: TAMANHO_PAGINA_SEM_UI_DE_PAGINACAO },
    })
    .then((response) => response.data.itens)
}
