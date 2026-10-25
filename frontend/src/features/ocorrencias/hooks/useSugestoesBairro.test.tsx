import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { API_BASE_URL } from '@/lib/env'
import { server } from '@/mocks/server'
import { mapearOcorrenciasPorBairro } from '../utils/mapearOcorrenciasPorBairro'
import { useContagemPorBairroQuery } from './useOcorrencias'
import { useSugestoesBairroQuery } from './useSugestoesBairro'

function criarWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useSugestoesBairroQuery', () => {
  it('devolve os bairros distintos já usados em ocorrências existentes', async () => {
    server.use(
      http.get(`${API_BASE_URL}/ocorrencias/estatisticas/bairro`, () =>
        HttpResponse.json([
          { bairro: 'Centro', quantidade: 2 },
          { bairro: 'Vila Nova', quantidade: 1 },
        ]),
      ),
    )

    const { result } = renderHook(() => useSugestoesBairroQuery(), { wrapper: criarWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(['Centro', 'Vila Nova'])
  })

  // T45: antes eram duas chaves e duas listagens de 500 ocorrências.
  it('compartilha uma única requisição com o gráfico de distribuição', async () => {
    const requisicoes = vi.fn()
    server.use(
      http.get(`${API_BASE_URL}/ocorrencias/estatisticas/bairro`, () => {
        requisicoes()
        return HttpResponse.json([{ bairro: 'Centro', quantidade: 3 }])
      }),
    )

    const { result } = renderHook(
      () => ({ sugestoes: useSugestoesBairroQuery(), grafico: useContagemPorBairroQuery(mapearOcorrenciasPorBairro) }),
      { wrapper: criarWrapper() },
    )

    await waitFor(() => expect(result.current.sugestoes.isSuccess && result.current.grafico.isSuccess).toBe(true))
    expect(result.current.sugestoes.data).toEqual(['Centro'])
    expect(result.current.grafico.data).toEqual([{ bairro: 'Centro', quantidade: 3 }])
    expect(requisicoes).toHaveBeenCalledTimes(1)
  })
})
