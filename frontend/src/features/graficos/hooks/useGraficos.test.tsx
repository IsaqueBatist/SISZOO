import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { API_BASE_URL } from '@/lib/env'
import { server } from '@/mocks/server'
import type { DashboardGraficos } from '../types/graficos.types'
import { useGraficosQuery } from './useGraficos'

function Wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('useGraficosQuery', () => {
  it('usa o mock quando VITE_USE_MOCK_GRAFICOS=true (setup), sem chamar a API', async () => {
    const { result } = renderHook(() => useGraficosQuery(2026), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.casosPorDoenca).toHaveLength(6)
    expect(result.current.data?.casosRaivaPorEspecie).toHaveLength(4)
  })

  it('chama a API real quando VITE_USE_MOCK_GRAFICOS=false', async () => {
    vi.stubEnv('VITE_USE_MOCK_GRAFICOS', 'false')

    const graficosReais: DashboardGraficos = {
      casosPorDoenca: [{ doenca: { codigo: 'raiva', nome: 'Raiva' }, quantidade: 1 }],
      casosRaivaPorEspecie: [],
      resultadosPorDoenca: [],
    }
    server.use(
      http.get(`${API_BASE_URL}/dashboard/graficos`, ({ request }) => {
        const ano = new URL(request.url).searchParams.get('ano')
        expect(ano).toBe('2026')
        return HttpResponse.json(graficosReais)
      }),
    )

    const { result } = renderHook(() => useGraficosQuery(2026), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(graficosReais)
  })

  it('chama a API real quando VITE_USE_MOCK_GRAFICOS está ausente', async () => {
    vi.stubEnv('VITE_USE_MOCK_GRAFICOS', undefined)

    const graficosReais: DashboardGraficos = {
      casosPorDoenca: [],
      casosRaivaPorEspecie: [],
      resultadosPorDoenca: [],
    }
    server.use(http.get(`${API_BASE_URL}/dashboard/graficos`, () => HttpResponse.json(graficosReais)))

    const { result } = renderHook(() => useGraficosQuery(2026), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(graficosReais)
  })
})
