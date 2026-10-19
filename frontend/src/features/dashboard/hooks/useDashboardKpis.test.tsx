import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { API_BASE_URL } from '@/lib/env'
import { server } from '@/mocks/server'
import type { DashboardKpis } from '../types/dashboard.types'
import { useKpisDashboardQuery } from './useDashboardKpis'

function Wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

afterEach(() => {
  vi.unstubAllEnvs()
})

function paginaVazia() {
  return { itens: [], pagina: 0, tamanho: 0, totalItens: 0, totalPaginas: 1 }
}

describe('useKpisDashboardQuery', () => {
  it('vacinação/adoções usam o mock por padrão (endpoint real ainda não existe); animais/ocorrências já são reais', async () => {
    server.use(
      http.get(`${API_BASE_URL}/animais`, () => HttpResponse.json(paginaVazia())),
      http.get(`${API_BASE_URL}/ocorrencias`, () => HttpResponse.json(paginaVazia())),
    )

    const { result } = renderHook(() => useKpisDashboardQuery(), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.vacinacao.percentualVacinados).toBe(84)
    expect(result.current.data?.adocoes.noMes).toBe(8)
    expect(result.current.data?.animais).toEqual({ total: 0, caninos: 0, felinos: 0 })
    expect(result.current.data?.ocorrencias.registradasHoje).toBe(0)
  })

  it('vacinação/adoções chamam a API real quando VITE_USE_MOCK_KPIS=false — animais/ocorrências continuam calculados no cliente', async () => {
    vi.stubEnv('VITE_USE_MOCK_KPIS', 'false')

    const kpisReais: DashboardKpis = {
      animais: { total: 999, caninos: 999, felinos: 999 }, // nunca usado: vem do cliente, não deste endpoint
      vacinacao: { percentualVacinados: 50, vacinados: 5, total: 10 },
      adocoes: { noMes: 1, metaMensal: 5 },
      ocorrencias: { registradasHoje: 999 }, // idem
    }
    server.use(
      http.get(`${API_BASE_URL}/dashboard/kpis`, () => HttpResponse.json(kpisReais)),
      http.get(`${API_BASE_URL}/animais`, () => HttpResponse.json(paginaVazia())),
      http.get(`${API_BASE_URL}/ocorrencias`, () => HttpResponse.json(paginaVazia())),
    )

    const { result } = renderHook(() => useKpisDashboardQuery(), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.vacinacao).toEqual(kpisReais.vacinacao)
    expect(result.current.data?.adocoes).toEqual(kpisReais.adocoes)
    // Prova que animais/ocorrências vieram do cálculo real (página vazia),
    // não do corpo de /dashboard/kpis (que tinha 999 nesses campos).
    expect(result.current.data?.animais).toEqual({ total: 0, caninos: 0, felinos: 0 })
    expect(result.current.data?.ocorrencias.registradasHoje).toBe(0)
  })
})
