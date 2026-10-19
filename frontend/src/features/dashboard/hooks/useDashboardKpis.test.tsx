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

describe('useKpisDashboardQuery', () => {
  it('usa o mock por padrão (endpoint real ainda não existe), sem chamar a API', async () => {
    const { result } = renderHook(() => useKpisDashboardQuery(), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.animais.total).toBe(147)
    expect(result.current.data?.vacinacao.percentualVacinados).toBe(84)
  })

  it('chama a API real quando VITE_USE_MOCK_KPIS=false', async () => {
    vi.stubEnv('VITE_USE_MOCK_KPIS', 'false')

    const kpisReais: DashboardKpis = {
      animais: { total: 10, caninos: 7, felinos: 3 },
      vacinacao: { percentualVacinados: 50, vacinados: 5, total: 10 },
      adocoes: { noMes: 1, metaMensal: 5 },
      ocorrencias: { abertasHoje: 0 },
    }
    server.use(http.get(`${API_BASE_URL}/dashboard/kpis`, () => HttpResponse.json(kpisReais)))

    const { result } = renderHook(() => useKpisDashboardQuery(), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(kpisReais)
  })
})
