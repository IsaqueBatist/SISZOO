import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { API_BASE_URL } from '@/lib/env'
import { server } from '@/mocks/server'
import { GraficoOcorrenciasPorBairro } from './GraficoOcorrenciasPorBairro'

vi.mock('recharts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('recharts')>()
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: ReactNode }) => (
      <div style={{ width: 400, height: 300 }}>{children}</div>
    ),
  }
})

function renderGrafico() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <GraficoOcorrenciasPorBairro />
    </QueryClientProvider>,
  )
}

function paginaDe(itens: { bairro: string }[], totalItens = itens.length) {
  return { itens, pagina: 0, tamanho: 500, totalItens, totalPaginas: 1 }
}

describe('GraficoOcorrenciasPorBairro', () => {
  it('renderiza a distribuição por bairro com valores', async () => {
    server.use(
      http.get(`${API_BASE_URL}/ocorrencias`, () =>
        HttpResponse.json(paginaDe([{ bairro: 'Centro' }, { bairro: 'Centro' }, { bairro: 'Vila Nova' }])),
      ),
    )
    renderGrafico()

    expect(await screen.findByText('Centro: 2')).toBeInTheDocument()
    expect(screen.getByText('Vila Nova: 1')).toBeInTheDocument()
  })

  it('mostra o aviso de amostra quando o total é maior do que o carregado', async () => {
    server.use(
      http.get(`${API_BASE_URL}/ocorrencias`, () => HttpResponse.json(paginaDe([{ bairro: 'Centro' }], 800))),
    )
    renderGrafico()

    expect(await screen.findByText(/Baseado nas 1 ocorrências mais recentes \(de 800 no total\)/)).toBeInTheDocument()
  })

  it('não mostra o aviso de amostra quando já carregou tudo', async () => {
    server.use(
      http.get(`${API_BASE_URL}/ocorrencias`, () => HttpResponse.json(paginaDe([{ bairro: 'Centro' }], 1))),
    )
    renderGrafico()

    await screen.findByText('Centro: 1')
    expect(screen.queryByText(/Baseado nas/)).not.toBeInTheDocument()
  })

  it('mostra estado vazio quando não há ocorrências com bairro', async () => {
    server.use(http.get(`${API_BASE_URL}/ocorrencias`, () => HttpResponse.json(paginaDe([]))))
    renderGrafico()

    expect(await screen.findByText('Sem dados no período.')).toBeInTheDocument()
  })

  it('mostra erro com retry quando a API falha', async () => {
    server.use(http.get(`${API_BASE_URL}/ocorrencias`, () => HttpResponse.json({ mensagem: 'Erro' }, { status: 500 })))
    renderGrafico()

    expect(await screen.findByRole('button', { name: 'Tentar novamente' })).toBeInTheDocument()
  })
})
