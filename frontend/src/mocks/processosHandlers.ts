import { http, HttpResponse } from 'msw'
import { API_BASE_URL } from '../lib/env'
import {
  CATALOGOS_PROCESSO_FIXTURE,
  paraResumoProcesso,
  processoCriadoFixture,
  processosFixture,
  resultadoProcessoFixture,
} from './processosFixtures'

// Handlers de processos (T29) com respostas FIXAS — sem estado e sem regra de
// negócio (validação, urgência derivada, vínculo e transições são do
// backend). O teste que precisa ver o estado depois da ação, ou forçar
// 403/404/409/422, sobrescreve o handler com `server.use()`.

function buscarFixture(id: string) {
  return processosFixture().find((item) => item.id === id) ?? null
}

function naoEncontrado() {
  return HttpResponse.json({ mensagem: 'Processo sanitario nao encontrado' }, { status: 404 })
}

export const processosHandlers = [
  // Antes de `/processos/:id` para "catalogos" não virar um id.
  http.get(`${API_BASE_URL}/processos/catalogos`, () => HttpResponse.json(CATALOGOS_PROCESSO_FIXTURE)),

  http.get(`${API_BASE_URL}/processos`, ({ request }) => {
    const url = new URL(request.url)
    const pagina = Number(url.searchParams.get('pagina') ?? '0')
    const tamanho = Number(url.searchParams.get('tamanho') ?? '20')
    // T45: `urgente` opcional, como o backend (ausente, sem filtro).
    const urgente = url.searchParams.get('urgente')
    const itens = processosFixture()
      .map(paraResumoProcesso)
      .filter((processo) => urgente === null || processo.urgente === (urgente === 'true'))
    return HttpResponse.json({ itens, pagina, tamanho, totalItens: itens.length, totalPaginas: 1 })
  }),

  http.get(`${API_BASE_URL}/processos/:id`, ({ params }) => {
    const processo = buscarFixture(params.id as string)
    return processo ? HttpResponse.json(processo) : naoEncontrado()
  }),

  http.post(`${API_BASE_URL}/processos`, () => HttpResponse.json(processoCriadoFixture())),

  http.patch(`${API_BASE_URL}/processos/:id/status`, async ({ params, request }) => {
    const processo = buscarFixture(params.id as string)
    if (!processo) return naoEncontrado()
    const { status } = (await request.json()) as { status: string }
    return HttpResponse.json({ ...processo, statusProcesso: status })
  }),

  // T34 + T37: resposta fixa — o processo "vira" COM_RESULTADO com o
  // resultado enviado, e o histórico ganha um item novo. Testes que
  // precisam do erro (422 fora de AGUARDANDO_RESULTADO, falha de rede)
  // sobrescrevem com `server.use()`.
  http.post(`${API_BASE_URL}/processos/:id/resultados`, async ({ params, request }) => {
    const processo = buscarFixture(params.id as string)
    if (!processo) return naoEncontrado()
    const corpo = (await request.json()) as {
      resultado: string
      dataResultado: string
      observacoes?: string
      retificaId?: string
      desfechoAnimal?: string
    }
    const resultado = CATALOGOS_PROCESSO_FIXTURE.resultadosLaboratoriais.find((item) => item.codigo === corpo.resultado)
    const desfecho = CATALOGOS_PROCESSO_FIXTURE.desfechos.find((item) => item.codigo === corpo.desfechoAnimal)
    const novoRegistro = resultadoProcessoFixture({
      id: `h8000000-0000-0000-0000-${String(processo.resultados.length + 1).padStart(12, '0')}`,
      resultado: resultado ?? { codigo: corpo.resultado, nome: corpo.resultado },
      dataResultado: corpo.dataResultado,
      observacoes: corpo.observacoes ?? null,
      retificaId: corpo.retificaId ?? null,
    })
    return HttpResponse.json({
      ...processo,
      statusProcesso: 'COM_RESULTADO',
      resultado: resultado ?? null,
      dataResultado: corpo.dataResultado,
      desfechoAnimal: desfecho ?? processo.desfechoAnimal,
      resultados: [...processo.resultados, novoRegistro],
    })
  }),
]
