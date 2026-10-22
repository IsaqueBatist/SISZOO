import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { API_BASE_URL } from '@/lib/env'
import { server } from '@/mocks/server'
import type { DashboardKpisApi } from '../types/dashboard.types'
import { useKpisDashboardQuery } from './useDashboardKpis'

function Wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('useKpisDashboardQuery', () => {
  it('usa o mock por padrão para animais/vacinação/ocorrências/alertas, e também mocka adoções (sem fonte real)', async () => {
    const { result } = renderHook(() => useKpisDashboardQuery(), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.animais.total).toBe(147)
    expect(result.current.data?.vacinacao.percentualVacinados).toBe(84)
    expect(result.current.data?.adocoes.noMes).toBe(8)
    expect(result.current.data?.alertas.length).toBeGreaterThan(0)
  })

  it('chama a API real quando VITE_USE_MOCK_KPIS=false, mas ainda mocka adoções', async () => {
    vi.stubEnv('VITE_USE_MOCK_KPIS', 'false')

    const kpisReais: DashboardKpisApi = {
      animais: { total: 10, caninos: 7, felinos: 3 },
      vacinacao: { percentualVacinados: 50, vacinados: 5, total: 10 },
      ocorrencias: { registradasHoje: 0 },
      alertas: [
        {
          tipo: 'baia_superlotada',
          severidade: 'critico',
          titulo: '1 baia(s) superlotada(s)',
          descricao: 'Baias com ocupação igual ou acima da capacidade.',
          total: 1,
        },
      ],
    }
    server.use(http.get(`${API_BASE_URL}/dashboard/kpis`, () => HttpResponse.json(kpisReais)))

    const { result } = renderHook(() => useKpisDashboardQuery(), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.animais).toEqual(kpisReais.animais)
    expect(result.current.data?.vacinacao).toEqual(kpisReais.vacinacao)
    expect(result.current.data?.ocorrencias).toEqual(kpisReais.ocorrencias)
    expect(result.current.data?.alertas).toEqual(kpisReais.alertas)
    // adocoes continua vindo do mock, mesmo com o resto real.
    expect(result.current.data?.adocoes.noMes).toBe(8)
  })
})
