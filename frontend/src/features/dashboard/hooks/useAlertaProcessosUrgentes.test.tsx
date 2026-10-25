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

function resumo(id: string, protocolo: string) {
  return {
    id,
    protocolo,
    dataAbertura: '2026-01-01',
    doenca: { codigo: 'raiva', nome: 'Raiva' },
    statusProcesso: 'ABERTO',
    urgente: true,
    ocorrenciaId: null,
    ocorrenciaProtocolo: null,
  }
}

describe('useProcessosUrgentesQuery', () => {
  it('pede só os urgentes ao backend (fixture padrão: 1 de 2)', async () => {
    const { result } = renderHook(() => useProcessosUrgentesQuery(), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.totalUrgentes).toBe(1)
    expect(result.current.data?.itens).toHaveLength(1)
    expect(result.current.data?.itens[0].protocolo).toBe('045/2026')
  })

  // T45: o total vem de `totalItens` do filtro do servidor — exato mesmo
  // quando há mais urgentes do que cabem na página (antes, acima de 50 o card
  // perdia itens sem aviso).
  it('usa urgente=true e o total exato do servidor, mesmo maior que a página', async () => {
    const parametros: URLSearchParams[] = []
    server.use(
      http.get(`${API_BASE_URL}/processos`, ({ request }) => {
        parametros.push(new URL(request.url).searchParams)
        return HttpResponse.json({
          itens: [resumo('1', '001/2026'), resumo('2', '002/2026'), resumo('3', '003/2026')],
          pagina: 0,
          tamanho: 10,
          totalItens: 60,
          totalPaginas: 6,
        })
      }),
    )

    const { result } = renderHook(() => useProcessosUrgentesQuery(), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(parametros[0].get('urgente')).toBe('true')
    expect(result.current.data?.totalUrgentes).toBe(60)
    expect(result.current.data?.itens).toHaveLength(3)
  })
})
