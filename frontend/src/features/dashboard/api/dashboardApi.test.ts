import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { API_BASE_URL } from '@/lib/env'
import { server } from '@/mocks/server'
import { buscarKpisParciaisReais } from './dashboardApi'

// buscarKpisParciaisReais não é um componente/hook — é testado direto (via
// MSW) em vez de através de um hook/tela, porque tem lógica própria não
// trivial (filtro de custódia, fuso horário) que merece cobertura focada e
// rápida; GraficosDashboard etc. continuam cobertos no nível de componente.

function animal(sobrescrever: Record<string, unknown>) {
  return {
    id: 'id',
    nome: 'Nome',
    especieCodigo: 'canino',
    especieNome: 'Canino',
    sexo: 'macho',
    raca: null,
    coloracao: null,
    pelagem: null,
    porte: null,
    pesoKg: null,
    idadeAprox: null,
    dataNascimentoAprox: null,
    microchip: null,
    esterilizado: false,
    dataEsterilizacao: null,
    statusCodigo: 'disponivel_adocao',
    statusNome: 'Disponível',
    motivoEntradaCodigo: 'resgate',
    motivoEntradaNome: 'Resgate',
    dataEntrada: '2026-01-01T09:00:00Z',
    baiaId: null,
    baiaNome: null,
    tipoBaiaNome: null,
    fichaCompleta: true,
    fotoUrl: null,
    observacoes: null,
    criadoPorId: 'id',
    criadoPorNome: 'Nome',
    criadoEm: '2026-01-01T09:00:00Z',
    atualizadoEm: '2026-01-01T09:00:00Z',
    ...sobrescrever,
  }
}

function mockarAnimais(itens: unknown[]) {
  server.use(
    http.get(`${API_BASE_URL}/animais`, () =>
      HttpResponse.json({ itens, pagina: 0, tamanho: 1000, totalItens: itens.length, totalPaginas: 1 }),
    ),
  )
}

function mockarOcorrencias(itens: unknown[]) {
  server.use(
    http.get(`${API_BASE_URL}/ocorrencias`, () =>
      HttpResponse.json({ itens, pagina: 0, tamanho: 500, totalItens: itens.length, totalPaginas: 1 }),
    ),
  )
}

afterEach(() => {
  vi.useRealTimers()
})

describe('buscarKpisParciaisReais', () => {
  it('total de animais exclui quem está fora da custódia e conta por espécie', async () => {
    mockarAnimais([
      animal({ id: '1', especieCodigo: 'canino', statusCodigo: 'disponivel_adocao' }),
      animal({ id: '2', especieCodigo: 'felino', statusCodigo: 'em_tratamento' }),
      animal({ id: '3', especieCodigo: 'canino', statusCodigo: 'adotado' }),
      animal({ id: '4', especieCodigo: 'felino', statusCodigo: 'obito_natural' }),
    ])
    mockarOcorrencias([])

    const resultado = await buscarKpisParciaisReais()

    expect(resultado.animais).toEqual({ total: 2, caninos: 1, felinos: 1 })
  })

  it('conta ocorrências registradas hoje no fuso America/Sao_Paulo, não em UTC', async () => {
    // 2026-05-21T01:00:00Z = 2026-05-20T22:00:00 em America/Sao_Paulo (UTC-3)
    // — ainda é dia 20 localmente, mesmo já sendo dia 21 em UTC.
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-21T01:00:00Z'))
    mockarAnimais([])
    mockarOcorrencias([{ dataAbertura: '2026-05-20' }, { dataAbertura: '2026-05-21' }, { dataAbertura: '2026-05-19' }])

    const resultado = await buscarKpisParciaisReais()

    expect(resultado.ocorrencias.registradasHoje).toBe(1)
  })

  it('conta ocorrências de qualquer status (não só ABERTA)', async () => {
    mockarAnimais([])
    server.use(
      http.get(`${API_BASE_URL}/ocorrencias`, ({ request }) => {
        expect(new URL(request.url).searchParams.get('status')).toBeNull()
        const hoje = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date())
        return HttpResponse.json({
          itens: [
            { dataAbertura: hoje, statusOcorrencia: 'ABERTA' },
            { dataAbertura: hoje, statusOcorrencia: 'ENCERRADA' },
          ],
          pagina: 0,
          tamanho: 500,
          totalItens: 2,
          totalPaginas: 1,
        })
      }),
    )

    const resultado = await buscarKpisParciaisReais()

    expect(resultado.ocorrencias.registradasHoje).toBe(2)
  })

  it('calcula a média por hora a partir das ocorrências de hoje e da hora local atual', async () => {
    vi.useFakeTimers()
    // 13h em America/Sao_Paulo (16h UTC, sem horário de verão).
    vi.setSystemTime(new Date('2026-05-20T16:00:00Z'))
    mockarAnimais([])
    mockarOcorrencias([{ dataAbertura: '2026-05-20' }, { dataAbertura: '2026-05-20' }])

    const resultado = await buscarKpisParciaisReais()

    expect(resultado.ocorrencias.registradasHoje).toBe(2)
    expect(resultado.ocorrencias.mediaPorHora).toBeCloseTo(2 / 13, 1)
  })
})
