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

const ROTA_CONTAGEM = `${API_BASE_URL}/ocorrencias/estatisticas/bairro`

function renderGrafico() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <GraficoOcorrenciasPorBairro />
    </QueryClientProvider>,
  )
}

describe('GraficoOcorrenciasPorBairro', () => {
  it('renderiza a distribuição por bairro com valores', async () => {
    server.use(
      http.get(ROTA_CONTAGEM, () =>
        HttpResponse.json([
          { bairro: 'Centro', quantidade: 2 },
          { bairro: 'Vila Nova', quantidade: 1 },
        ]),
      ),
    )
    renderGrafico()

    expect(await screen.findByText('Centro: 2')).toBeInTheDocument()
    expect(screen.getByText('Vila Nova: 1')).toBeInTheDocument()
  })

  it('junta as grafias do mesmo bairro somando as contagens do backend', async () => {
    server.use(
      http.get(ROTA_CONTAGEM, () =>
        HttpResponse.json([
          { bairro: 'Sao Luiz', quantidade: 5 },
          { bairro: 'São Luiz', quantidade: 2 },
        ]),
      ),
    )
    renderGrafico()

    expect(await screen.findByText('Sao Luiz: 7')).toBeInTheDocument()
  })

  // T45: a contagem vem agregada de todo o histórico — o gráfico não baixa
  // mais a listagem de ocorrências (nem mostra o antigo aviso de "amostra
  // das 500 mais recentes", que deixou de existir).
  it('usa a contagem agregada e não baixa a listagem de ocorrências', async () => {
    const listagem = vi.fn()
    server.use(
      http.get(ROTA_CONTAGEM, () => HttpResponse.json([{ bairro: 'Centro', quantidade: 800 }])),
      http.get(`${API_BASE_URL}/ocorrencias`, () => {
        listagem()
        return HttpResponse.json({ itens: [], pagina: 0, tamanho: 20, totalItens: 0, totalPaginas: 0 })
      }),
    )
    renderGrafico()

    expect(await screen.findByText('Centro: 800')).toBeInTheDocument()
    expect(screen.queryByText(/Baseado nas/)).not.toBeInTheDocument()
    expect(listagem).not.toHaveBeenCalled()
  })

  it('mostra estado vazio quando não há ocorrências com bairro', async () => {
    server.use(http.get(ROTA_CONTAGEM, () => HttpResponse.json([])))
    renderGrafico()

    expect(await screen.findByText('Sem dados no período.')).toBeInTheDocument()
  })

  it('mostra erro com retry quando a API falha', async () => {
    server.use(http.get(ROTA_CONTAGEM, () => HttpResponse.json({ mensagem: 'Erro' }, { status: 500 })))
    renderGrafico()

    expect(await screen.findByRole('button', { name: 'Tentar novamente' })).toBeInTheDocument()
  })
})
