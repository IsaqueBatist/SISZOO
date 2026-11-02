import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { API_BASE_URL } from '@/lib/env'
import { server } from '@/mocks/server'
import { adicionarDiasIso } from '@/test/datas'
import { useTimelineAnimal } from './useTimelineAnimal'
import type { Prescricao, Procedimento, Vacinacao } from '../types/historico.types'

const ANIMAL_ID = 'timeline-teste-0000-0000-000000000001'

const HOJE = '2026-09-10'
const CRIADO_EM = `${HOJE}T15:00:00.000Z`

function seedVacinasGrandes(): Vacinacao[] {
  return Array.from({ length: 25 }, (_, indice) => {
    const dias = indice + 1
    return {
      id: `vac-${dias}`,
      animalId: ANIMAL_ID,
      vacinaCodigo: 'antirrabica',
      vacinaNome: `V${dias}`,
      aplicadoPorId: null,
      aplicadoPorNome: null,
      dataAplicacao: adicionarDiasIso(HOJE, -dias),
      dataValidade: null,
      numeroDose: null,
      doseQuantidade: 1,
      doseUnidade: null,
      lote: null,
      observacoes: null,
      retificaId: null,
      retificadoPorId: null,
      statusRegistro: 'ATIVO',
      criadoEm: CRIADO_EM,
    }
  })
}

function seedProcedimentosFronteira(): Procedimento[] {
  return [
    {
      id: 'proc-20',
      animalId: ANIMAL_ID,
      tipoProcedimentoCodigo: 'atendimento_clinico',
      tipoProcedimentoNome: 'P20',
      executadoPorId: null,
      executadoPorNome: null,
      data: adicionarDiasIso(HOJE, -20),
      descricao: null,
      resultado: null,
      retificaId: null,
      retificadoPorId: null,
      statusRegistro: 'ATIVO',
      criadoEm: CRIADO_EM,
    },
    {
      id: 'proc-21',
      animalId: ANIMAL_ID,
      tipoProcedimentoCodigo: 'atendimento_clinico',
      tipoProcedimentoNome: 'P21',
      executadoPorId: null,
      executadoPorNome: null,
      data: adicionarDiasIso(HOJE, -21),
      descricao: null,
      resultado: null,
      retificaId: null,
      retificadoPorId: null,
      statusRegistro: 'ATIVO',
      criadoEm: CRIADO_EM,
    },
  ]
}

function instalarHandlersDeFronteira() {
  const vacinas = seedVacinasGrandes()
  const procedimentos = seedProcedimentosFronteira()
  const prescricoes: Prescricao[] = []

  function paginar<T>(itens: T[], pagina: number, tamanho: number) {
    const totalItens = itens.length
    const totalPaginas = Math.max(Math.ceil(totalItens / tamanho), 1)
    const inicio = pagina * tamanho
    return { itens: itens.slice(inicio, inicio + tamanho), pagina, tamanho, totalItens, totalPaginas }
  }

  server.use(
    http.get(`${API_BASE_URL}/vacinacoes`, ({ request }) => {
      const url = new URL(request.url)
      const pagina = Number(url.searchParams.get('pagina') ?? '0')
      const tamanho = Number(url.searchParams.get('tamanho') ?? '20')
      return HttpResponse.json(paginar(vacinas, pagina, tamanho))
    }),
    http.get(`${API_BASE_URL}/procedimentos`, ({ request }) => {
      const url = new URL(request.url)
      const pagina = Number(url.searchParams.get('pagina') ?? '0')
      const tamanho = Number(url.searchParams.get('tamanho') ?? '20')
      return HttpResponse.json(paginar(procedimentos, pagina, tamanho))
    }),
    http.get(`${API_BASE_URL}/prescricoes`, ({ request }) => {
      const url = new URL(request.url)
      const pagina = Number(url.searchParams.get('pagina') ?? '0')
      const tamanho = Number(url.searchParams.get('tamanho') ?? '20')
      return HttpResponse.json(paginar(prescricoes, pagina, tamanho))
    }),
  )
}

function renderTimeline() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return renderHook(({ refreshKey }: { refreshKey: number }) => useTimelineAnimal(ANIMAL_ID, undefined, refreshKey), {
    initialProps: { refreshKey: 0 },
    wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
  })
}

describe('useTimelineAnimal (merge k-way de fontes paginadas)', () => {
  it('mescla vacinas (2 páginas) e procedimentos na ordem cronológica correta, sem perder itens na fronteira de página', async () => {
    instalarHandlersDeFronteira()
    const { result } = renderTimeline()

    await act(async () => {
      await result.current.carregarMais(28)
    })

    await waitFor(() => expect(result.current.fimDoHistorico).toBe(true))

    const sequenciaEsperada = [
      ...seedVacinasGrandes().map((v) => ({ tipo: 'vacina', data: v.dataAplicacao })),
      ...seedProcedimentosFronteira().map((p) => ({ tipo: 'procedimento', data: p.data })),
    ].sort((a, b) => (a.data < b.data ? 1 : a.data > b.data ? -1 : 0))

    expect(result.current.eventos).toHaveLength(27)
    expect(result.current.eventos.map((e) => ({ tipo: e.tipo, data: e.data }))).toEqual(sequenciaEsperada)

    expect(result.current.eventos.some((e) => e.titulo.includes('V25'))).toBe(true)
  })

  it('carregarMais incremental preserva a ordem entre chamadas', async () => {
    instalarHandlersDeFronteira()
    const { result } = renderTimeline()

    await act(async () => {
      await result.current.carregarMais(10)
    })
    const primeiros10 = result.current.eventos.map((e) => e.data)

    await act(async () => {
      await result.current.carregarMais(10)
    })
    const primeiros20 = result.current.eventos.map((e) => e.data)

    expect(primeiros20.slice(0, 10)).toEqual(primeiros10)
    for (let i = 1; i < primeiros20.length; i++) {
      expect(primeiros20[i] <= primeiros20[i - 1]).toBe(true)
    }
  })
})
