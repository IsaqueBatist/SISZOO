import { http, HttpResponse } from 'msw'
import { API_BASE_URL } from '../lib/env'
import {
  ANEXO_CRIADO_FIXTURE,
  CATALOGOS_OCORRENCIA_FIXTURE,
  ocorrenciaCriadaFixture,
  ocorrenciasFixture,
  resumosFixture,
} from './ocorrenciasFixtures'

// Handlers de ocorrências (T25, PR2) com respostas FIXAS — sem estado e sem
// regra de negócio (máscara, transições, protocolo e D12 são do backend).
// Cada mutação devolve a fixture da ocorrência como está; o teste que precisa
// ver o estado depois da ação, ou forçar 403/404/409/413/422, sobrescreve o
// handler com `server.use()`.

function buscarFixture(id: string) {
  return ocorrenciasFixture().find((item) => item.id === id) ?? null
}

function naoEncontrada() {
  return HttpResponse.json({ mensagem: 'Ocorrência não encontrada' }, { status: 404 })
}

export const ocorrenciasHandlers = [
  // Antes de `/ocorrencias/:id` para "catalogos" não virar um id.
  http.get(`${API_BASE_URL}/ocorrencias/catalogos`, () => HttpResponse.json(CATALOGOS_OCORRENCIA_FIXTURE)),

  http.get(`${API_BASE_URL}/ocorrencias`, ({ request }) => {
    const url = new URL(request.url)
    const pagina = Number(url.searchParams.get('pagina') ?? '0')
    const tamanho = Number(url.searchParams.get('tamanho') ?? '20')
    // F2-010: período da data de abertura (dias inclusivos), como no backend.
    const de = url.searchParams.get('de')
    const ate = url.searchParams.get('ate')
    const itens = resumosFixture().filter((o) => (!de || o.dataAbertura >= de) && (!ate || o.dataAbertura <= ate))
    return HttpResponse.json({ itens, pagina, tamanho, totalItens: itens.length, totalPaginas: 1 })
  }),

  http.get(`${API_BASE_URL}/ocorrencias/:id`, ({ params }) => {
    const ocorrencia = buscarFixture(params.id as string)
    return ocorrencia ? HttpResponse.json(ocorrencia) : naoEncontrada()
  }),

  http.post(`${API_BASE_URL}/ocorrencias`, () => HttpResponse.json(ocorrenciaCriadaFixture(), { status: 201 })),

  http.put(`${API_BASE_URL}/ocorrencias/:id`, ({ params }) => {
    const ocorrencia = buscarFixture(params.id as string)
    return ocorrencia ? HttpResponse.json(ocorrencia) : naoEncontrada()
  }),

  http.patch(`${API_BASE_URL}/ocorrencias/:id/status`, ({ params }) => {
    const ocorrencia = buscarFixture(params.id as string)
    return ocorrencia ? HttpResponse.json(ocorrencia) : naoEncontrada()
  }),

  http.post(`${API_BASE_URL}/ocorrencias/:id/encerramento`, ({ params }) => {
    const ocorrencia = buscarFixture(params.id as string)
    return ocorrencia ? HttpResponse.json(ocorrencia) : naoEncontrada()
  }),

  http.post(`${API_BASE_URL}/ocorrencias/:id/notas`, ({ params }) => {
    const ocorrencia = buscarFixture(params.id as string)
    return ocorrencia ? HttpResponse.json(ocorrencia, { status: 201 }) : naoEncontrada()
  }),

  http.post(`${API_BASE_URL}/ocorrencias/:id/anexos`, () => HttpResponse.json(ANEXO_CRIADO_FIXTURE, { status: 201 })),

  http.get(`${API_BASE_URL}/ocorrencias/:id/anexos/:anexoId`, () =>
    HttpResponse.arrayBuffer(new Uint8Array([0xff, 0xd8, 0xff]).buffer, { headers: { 'Content-Type': 'image/jpeg' } }),
  ),
]
