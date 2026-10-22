import { http, HttpResponse } from 'msw'
import { API_BASE_URL } from '../lib/env'
import {
  historicoRelatoriosFixture,
  previewOcupacaoBaiasFixture,
  previewVacinacaoFixture,
  TIPOS_RELATORIO_FIXTURE,
} from './relatoriosFixtures'

// Handlers de relatorios (T41) com respostas FIXAS, só para os 2 tipos
// implementados no backend (PR1). Os outros 4 respondem 422 "ainda não
// implementado", igual ao backend real.
const TIPOS_IMPLEMENTADOS = new Set(['ocupacao_baias', 'vacinacao'])

export const relatoriosHandlers = [
  http.get(`${API_BASE_URL}/relatorios/tipos`, () => HttpResponse.json(TIPOS_RELATORIO_FIXTURE)),

  http.get(`${API_BASE_URL}/relatorios/preview`, ({ request }) => {
    const tipo = new URL(request.url).searchParams.get('tipo')
    if (tipo === 'ocupacao_baias') return HttpResponse.json(previewOcupacaoBaiasFixture())
    if (tipo === 'vacinacao') return HttpResponse.json(previewVacinacaoFixture())
    return HttpResponse.json({ mensagem: 'Tipo de relatório ainda não implementado' }, { status: 422 })
  }),

  http.post(`${API_BASE_URL}/relatorios/exportar`, async ({ request }) => {
    const body = (await request.json()) as { tipo: string; formato: 'csv' | 'pdf' }
    if (!TIPOS_IMPLEMENTADOS.has(body.tipo)) {
      return HttpResponse.json({ mensagem: 'Tipo de relatório ainda não implementado' }, { status: 422 })
    }
    const conteudo = body.formato === 'csv' ? 'Baia;Capacidade\r\n' : '%PDF-1.4 conteúdo de teste'
    const nomeArquivo = `${body.tipo}-2026-01-01_2026-09-10.${body.formato}`
    return new HttpResponse(conteudo, {
      status: 200,
      headers: {
        'Content-Type': body.formato === 'csv' ? 'text/csv;charset=UTF-8' : 'application/pdf',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(nomeArquivo)}`,
      },
    })
  }),

  http.get(`${API_BASE_URL}/relatorios/historico`, ({ request }) => {
    const url = new URL(request.url)
    const pagina = Number(url.searchParams.get('pagina') ?? '0')
    const tamanho = Number(url.searchParams.get('tamanho') ?? '10')
    const itens = historicoRelatoriosFixture()
    return HttpResponse.json({ itens, pagina, tamanho, totalItens: itens.length, totalPaginas: 1 })
  }),
]
