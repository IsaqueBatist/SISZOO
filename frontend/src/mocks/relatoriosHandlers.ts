import { http, HttpResponse } from 'msw'
import { API_BASE_URL } from '../lib/env'
import {
  historicoRelatoriosFixture,
  previewAdocoesFixture,
  previewAnualProcessosFixture,
  previewOcorrenciasBairroFixture,
  previewOcupacaoBaiasFixture,
  previewProcedimentosFixture,
  previewVacinacaoFixture,
  TIPOS_RELATORIO_FIXTURE,
} from './relatoriosFixtures'

// Handlers de relatorios (T41) com respostas FIXAS, para os 6 tipos do
// catálogo (PR1: ocupacao_baias, vacinacao; PR2: os outros 4).
export const relatoriosHandlers = [
  http.get(`${API_BASE_URL}/relatorios/tipos`, () => HttpResponse.json(TIPOS_RELATORIO_FIXTURE)),

  http.get(`${API_BASE_URL}/relatorios/preview`, ({ request }) => {
    const tipo = new URL(request.url).searchParams.get('tipo')
    switch (tipo) {
      case 'ocupacao_baias':
        return HttpResponse.json(previewOcupacaoBaiasFixture())
      case 'vacinacao':
        return HttpResponse.json(previewVacinacaoFixture())
      case 'procedimentos':
        return HttpResponse.json(previewProcedimentosFixture())
      case 'ocorrencias_bairro':
        return HttpResponse.json(previewOcorrenciasBairroFixture())
      case 'adocoes':
        return HttpResponse.json(previewAdocoesFixture())
      case 'anual_processos':
        return HttpResponse.json(previewAnualProcessosFixture())
      default:
        return HttpResponse.json({ mensagem: 'Tipo de relatório inválido' }, { status: 422 })
    }
  }),

  http.post(`${API_BASE_URL}/relatorios/exportar`, async ({ request }) => {
    const body = (await request.json()) as { tipo: string; formato: 'csv' | 'pdf' }
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
