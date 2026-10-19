import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { API_BASE_URL } from '@/lib/env'
import { server } from '@/mocks/server'
import { Dashboard } from './Dashboard'

function renderDashboard() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/processos" element={<p>Tela de processos</p>} />
          <Route path="/processos/:id" element={<p>Detalhe do processo</p>} />
          <Route path="/alertas/vacinas" element={<p>Tela de alertas de vacina</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function processoResumo(sobrescrever: Record<string, unknown>) {
  return {
    dataAbertura: '2026-01-01',
    doenca: { codigo: 'raiva', nome: 'Raiva' },
    statusProcesso: 'ABERTO',
    ocorrenciaId: null,
    ocorrenciaProtocolo: null,
    ...sobrescrever,
  }
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('Dashboard', () => {
  it('renderiza os KPIs com dados mockados e mostra o selo de demonstração', async () => {
    renderDashboard()

    expect(await screen.findByText('147')).toBeInTheDocument()
    expect(screen.getByText('84')).toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument()
    expect(screen.getByText('Dados de demonstração')).toBeInTheDocument()
  })

  it('mostra skeleton enquanto os dados carregam e some depois', async () => {
    const { container } = renderDashboard()

    expect(container.querySelectorAll('.skel').length).toBeGreaterThan(0)
    await waitFor(() => expect(container.querySelectorAll('.skel').length).toBe(0))
  })

  it('erro ao carregar KPIs mostra retry e some o selo de demonstração', async () => {
    vi.stubEnv('VITE_USE_MOCK_KPIS', 'false')

    let chamadas = 0
    server.use(
      http.get(`${API_BASE_URL}/dashboard/kpis`, () => {
        chamadas += 1
        if (chamadas === 1) {
          return HttpResponse.json({ mensagem: 'Erro interno' }, { status: 500 })
        }
        return HttpResponse.json({
          animais: { total: 10, caninos: 7, felinos: 3 },
          vacinacao: { percentualVacinados: 50, vacinados: 5, total: 10 },
          adocoes: { noMes: 1, metaMensal: 5 },
          ocorrencias: { abertasHoje: 0 },
        })
      }),
    )

    const user = userEvent.setup()
    renderDashboard()

    expect(screen.queryByText('Dados de demonstração')).not.toBeInTheDocument()
    const botaoRetry = await screen.findByRole('button', { name: 'Tentar novamente' })
    await user.click(botaoRetry)

    expect(await screen.findByText('10')).toBeInTheDocument()
    expect(chamadas).toBe(2)
  })

  it('alerta de vacina mostra a severidade com ícone e texto (vencida antes de a vencer)', async () => {
    const { container } = renderDashboard()

    await screen.findByText(/vacina/)
    await waitFor(() => expect(container.querySelector('.severidade-vencida')).not.toBeNull())
    expect(container.querySelector('.severidade-a-vencer')).not.toBeNull()
  })

  it('alerta de processos urgentes mostra o protocolo (fixture padrão: 1 urgente) e nunca dado de denunciante', async () => {
    renderDashboard()

    const link = await screen.findByRole('link', { name: '045/2026 (Raiva)' })
    expect(link).toHaveAttribute('href', expect.stringContaining('/processos/'))

    const alertaProcessos = link.closest('.alert') as HTMLElement
    expect(within(alertaProcessos).queryByText(/telefone|cpf|email|respons[aá]vel/i)).not.toBeInTheDocument()
  })

  it('clique no processo urgente navega para o detalhe; "ver todos" navega para a lista', async () => {
    const user = userEvent.setup()
    renderDashboard()

    const link = await screen.findByRole('link', { name: '045/2026 (Raiva)' })
    await user.click(link)

    expect(await screen.findByText('Detalhe do processo')).toBeInTheDocument()
  })

  it('navegação por teclado (tab + Enter) no processo urgente também navega', async () => {
    const user = userEvent.setup()
    renderDashboard()

    const link = await screen.findByRole('link', { name: '045/2026 (Raiva)' })
    link.focus()
    expect(link).toHaveFocus()
    await user.keyboard('{Enter}')

    expect(await screen.findByText('Detalhe do processo')).toBeInTheDocument()
  })

  it('mostra "e mais N" quando há mais urgentes do que o resumo exibe', async () => {
    server.use(
      http.get(`${API_BASE_URL}/processos`, () =>
        HttpResponse.json({
          itens: [1, 2, 3, 4, 5].map((n) =>
            processoResumo({ id: String(n), protocolo: `00${n}/2026`, urgente: true }),
          ),
          pagina: 0,
          tamanho: 50,
          totalItens: 5,
          totalPaginas: 1,
        }),
      ),
    )
    renderDashboard()

    expect(await screen.findByText(/e mais 2/)).toBeInTheDocument()
  })

  it('card de processos urgentes some (estado vazio) quando não há nenhum urgente', async () => {
    server.use(
      http.get(`${API_BASE_URL}/processos`, () =>
        HttpResponse.json({
          itens: [processoResumo({ id: '1', protocolo: '001/2026', urgente: false })],
          pagina: 0,
          tamanho: 50,
          totalItens: 1,
          totalPaginas: 1,
        }),
      ),
    )
    renderDashboard()

    expect(await screen.findByText('Nenhum processo urgente em aberto.')).toBeInTheDocument()
  })
})
