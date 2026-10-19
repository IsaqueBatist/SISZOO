import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { API_BASE_URL } from '@/lib/env'
import { server } from '@/mocks/server'
import { useProcessosUrgentesQuery } from './useAlertaProcessosUrgentes'

function Wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

describe('useProcessosUrgentesQuery', () => {
  it('filtra só os processos urgentes da página retornada pela API (fixture padrão: 1 de 2)', async () => {
    const { result } = renderHook(() => useProcessosUrgentesQuery(), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.totalUrgentes).toBe(1)
    expect(result.current.data?.itens).toHaveLength(1)
    expect(result.current.data?.itens[0].protocolo).toBe('045/2026')
  })

  it('conta corretamente quando há mais de um processo urgente', async () => {
    server.use(
      http.get(`${API_BASE_URL}/processos`, () =>
        HttpResponse.json({
          itens: [
            {
              id: '1',
              protocolo: '001/2026',
              dataAbertura: '2026-01-01',
              doenca: { codigo: 'raiva', nome: 'Raiva' },
              statusProcesso: 'ABERTO',
              urgente: true,
              ocorrenciaId: null,
              ocorrenciaProtocolo: null,
            },
            {
              id: '2',
              protocolo: '002/2026',
              dataAbertura: '2026-01-02',
              doenca: { codigo: 'raiva', nome: 'Raiva' },
              statusProcesso: 'ABERTO',
              urgente: true,
              ocorrenciaId: null,
              ocorrenciaProtocolo: null,
            },
            {
              id: '3',
              protocolo: '003/2026',
              dataAbertura: '2026-01-03',
              doenca: { codigo: 'raiva', nome: 'Raiva' },
              statusProcesso: 'ABERTO',
              urgente: false,
              ocorrenciaId: null,
              ocorrenciaProtocolo: null,
            },
          ],
          pagina: 0,
          tamanho: 50,
          totalItens: 3,
          totalPaginas: 1,
        }),
      ),
    )

    const { result } = renderHook(() => useProcessosUrgentesQuery(), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.totalUrgentes).toBe(2)
  })
})
