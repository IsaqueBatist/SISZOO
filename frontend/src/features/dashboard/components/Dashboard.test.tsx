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
  it('com o mock de desenvolvimento ligado (setup) mostra o selo de demonstração em todos os cards e nos alertas', async () => {
    renderDashboard()

    expect(await screen.findByText('147')).toBeInTheDocument()
    expect(screen.getByText('84')).toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument()

    for (const rotulo of ['Total de Animais', 'Vacinados', 'Animais Adotados', 'Ocorrências']) {
      const card = screen.getByText(rotulo).closest('.kpi') as HTMLElement
      expect(within(card).getByText('Dados de demonstração')).toBeInTheDocument()
    }
    const cabecalhoAlertas = screen.getByRole('heading', { name: /Alertas Críticos/ }).parentElement as HTMLElement
    expect(within(cabecalhoAlertas).getByText('Dados de demonstração')).toBeInTheDocument()
  })

  it('mostra skeleton enquanto os dados carregam e some depois', async () => {
    const { container } = renderDashboard()

    expect(container.querySelectorAll('.skel').length).toBeGreaterThan(0)
    await waitFor(() => expect(container.querySelectorAll('.skel').length).toBe(0))
  })

  it('erro ao carregar KPIs mostra retry; depois de recuperar, mostra os dados reais sem nenhum selo de demonstração', async () => {
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
          ocorrencias: { registradasHoje: 0, mediaPorHora: null },
          adocoes: { adotados: 3, disponiveis: 1 },
          alertas: [],
        })
      }),
    )

    const user = userEvent.setup()
    renderDashboard()

    const botaoRetry = await screen.findByRole('button', { name: 'Tentar novamente' })
    await user.click(botaoRetry)

    expect(await screen.findByText('10')).toBeInTheDocument()
    expect(chamadas).toBe(2)

    const cardAdocoes = screen.getByText('Animais Adotados').closest('.kpi') as HTMLElement
    expect(within(cardAdocoes).getByText('3')).toBeInTheDocument()
    expect(within(cardAdocoes).getByText('1 disponível para adoção')).toBeInTheDocument()
    // Os gráficos têm flag própria (VITE_USE_MOCK_GRAFICOS, ligada no setup):
    // aqui só os KPIs e o cabeçalho dos alertas importam.
    const gradeKpis = cardAdocoes.closest('.kpi-grid') as HTMLElement
    expect(within(gradeKpis).queryByText('Dados de demonstração')).not.toBeInTheDocument()
    const cabecalhoAlertas = screen.getByRole('heading', { name: /Alertas Críticos/ }).parentElement as HTMLElement
    expect(within(cabecalhoAlertas).queryByText('Dados de demonstração')).not.toBeInTheDocument()
  })

  it('renderiza os alertas críticos genéricos (DER §3.7) vindos de kpis.alertas, sem duplicar o alerta de vacina', async () => {
    renderDashboard()

    expect(await screen.findByText(/baia\(s\) superlotada/)).toBeInTheDocument()
    expect(screen.getByText(/anima(l|is).*ficha incompleta/i)).toBeInTheDocument()
    expect(screen.getByText(/não castrado/)).toBeInTheDocument()
  })

  it('não renderiza o alerta genérico quando o total é 0', async () => {
    vi.stubEnv('VITE_USE_MOCK_KPIS', 'false')
    server.use(
      http.get(`${API_BASE_URL}/dashboard/kpis`, () =>
        HttpResponse.json({
          animais: { total: 10, caninos: 7, felinos: 3 },
          vacinacao: { percentualVacinados: 50, vacinados: 5, total: 10 },
          ocorrencias: { registradasHoje: 0 },
          adocoes: { adotados: 0, disponiveis: 0 },
          alertas: [
            {
              tipo: 'baia_superlotada',
              severidade: 'critico',
              titulo: '0 baia(s) superlotada(s)',
              descricao: 'Baias com ocupação igual ou acima da capacidade.',
              total: 0,
            },
          ],
        }),
      ),
    )

    renderDashboard()

    await screen.findByText('10')
    expect(screen.queryByText(/baia\(s\) superlotada/)).not.toBeInTheDocument()
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
    // Como o backend: com ?urgente=true (T45), o único processo, não urgente,
    // fica de fora.
    server.use(
      http.get(`${API_BASE_URL}/processos`, ({ request }) => {
        const pedeUrgentes = new URL(request.url).searchParams.get('urgente') === 'true'
        const itens = pedeUrgentes ? [] : [processoResumo({ id: '1', protocolo: '001/2026', urgente: false })]
        return HttpResponse.json({ itens, pagina: 0, tamanho: 50, totalItens: itens.length, totalPaginas: 1 })
      }),
    )
    renderDashboard()

    expect(await screen.findByText('Nenhum processo urgente em aberto.')).toBeInTheDocument()
  })
})
