import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { API_BASE_URL } from '@/lib/env'
import { server } from '@/mocks/server'
import { useSugestoesBairroQuery } from './useSugestoesBairro'

function Wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

describe('useSugestoesBairroQuery', () => {
  it('devolve os bairros distintos já usados em ocorrências existentes', async () => {
    server.use(
      http.get(`${API_BASE_URL}/ocorrencias`, () =>
        HttpResponse.json({
          itens: [{ bairro: 'Centro' }, { bairro: 'Centro' }, { bairro: 'Vila Nova' }],
          pagina: 0,
          tamanho: 500,
          totalItens: 3,
          totalPaginas: 1,
        }),
      ),
    )

    const { result } = renderHook(() => useSugestoesBairroQuery(), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(['Centro', 'Vila Nova'])
  })
})
