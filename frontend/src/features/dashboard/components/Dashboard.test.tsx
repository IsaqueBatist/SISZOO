import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { API_BASE_URL } from '@/lib/env'
import { server } from '@/mocks/server'
import { AuthContext, type AuthContextValue } from '@/features/auth/hooks/authContextValue'
import { Dashboard } from './Dashboard'

function renderDashboard(roleKey: AuthContextValue['roleKey'] = 'admin') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/dashboard']}>
        <AuthContext.Provider value={{ roleKey } as AuthContextValue}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/processos" element={<p>Tela de processos</p>} />
          <Route path="/processos/:id" element={<p>Detalhe do processo</p>} />
          <Route path="/alertas/vacinas" element={<p>Tela de alertas de vacina</p>} />
          <Route path="/animais" element={<p>Tela de animais</p>} />
        </Routes>
        </AuthContext.Provider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function baia(sobrescrever: Record<string, unknown>) {
  return {
    tipoBaiaCodigo: 'interna',
    tipoBaiaNome: 'Interna',
    finalidade: null,
    ativa: true,
    observacoes: null,
    ...sobrescrever,
  }
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
  it('com o mock de desenvolvimento ligado (setup) mostra o selo de demonstração em todos os cards e nos indicadores', async () => {
    renderDashboard()

    expect(await screen.findByText('147')).toBeInTheDocument()
    expect(screen.getByText('84')).toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument()

    for (const rotulo of ['Animais sob custódia', 'Vacinados', 'Ocorrências hoje', 'Animais adotados']) {
      const card = screen.getByText(rotulo).closest('.kpi') as HTMLElement
      expect(within(card).getByText('Dados de demonstração')).toBeInTheDocument()
    }
    const cabecalhoAlertas = screen.getByRole('heading', { name: 'Indicadores' }).parentElement as HTMLElement
    expect(within(cabecalhoAlertas).getByText('Dados de demonstração')).toBeInTheDocument()
  })

  it('Agente Sanitário não vê nem consulta vacinas e pendências de animais; os processos urgentes continuam', async () => {
    const consultas: string[] = []
    server.use(
      http.get(`${API_BASE_URL}/alertas/vacinas`, ({ request }) => {
        consultas.push(request.url)
        return HttpResponse.json([])
      }),
      http.get(`${API_BASE_URL}/animais`, ({ request }) => {
        consultas.push(request.url)
        return HttpResponse.json({ itens: [], pagina: 0, tamanho: 3, totalItens: 7, totalPaginas: 1 })
      }),
    )
    renderDashboard('agente')

    expect(await screen.findByRole('link', { name: '045/2026 (Raiva)' })).toBeInTheDocument()
    expect(screen.queryByText(/reforço pendente/)).not.toBeInTheDocument()
    expect(screen.queryByText(/ficha incompleta/)).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /ver situação vacinal/i })).not.toBeInTheDocument()
    expect(consultas).toHaveLength(0)
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

    const cardAdocoes = screen.getByText('Animais adotados').closest('.kpi') as HTMLElement
    expect(within(cardAdocoes).getByText('3')).toBeInTheDocument()
    expect(within(cardAdocoes).getByText('1 disponível para adoção')).toBeInTheDocument()
    const gradeKpis = cardAdocoes.closest('.kpi-grid') as HTMLElement
    expect(within(gradeKpis).queryByText('Dados de demonstração')).not.toBeInTheDocument()
    const cabecalhoAlertas = screen.getByRole('heading', { name: 'Indicadores' }).parentElement as HTMLElement
    expect(within(cabecalhoAlertas).queryByText('Dados de demonstração')).not.toBeInTheDocument()
  })

  it('baia superlotada vem da lista de baias e mostra o nome e a ocupação', async () => {
    server.use(
      http.get(`${API_BASE_URL}/baias`, () =>
        HttpResponse.json({
          itens: [
            baia({ id: 'b1', nome: 'Canil Lotado', capacidade: 2, ocupacaoAtual: 2, superlotada: true }),
            baia({ id: 'b2', nome: 'Canil Livre', capacidade: 5, ocupacaoAtual: 1, superlotada: false }),
            baia({ id: 'b3', nome: 'Canil Inativo', capacidade: 1, ocupacaoAtual: 3, superlotada: true, ativa: false }),
          ],
          pagina: 0,
          tamanho: 500,
          totalItens: 3,
          totalPaginas: 1,
        }),
      ),
    )
    renderDashboard()

    const titulo = await screen.findByRole('link', { name: '1 baia superlotada' })
    expect(titulo).toHaveAttribute('href', '/baias?lotacao=superlotada')
    const item = titulo.closest('li.pendencia') as HTMLElement
    expect(item).toHaveTextContent('Canil Lotado (2/2)')
    expect(item).not.toHaveTextContent('Canil Inativo')
  })

  it('pendência de animal mostra a quantidade da API, os nomes e leva à lista filtrada', async () => {
    server.use(
      http.get(`${API_BASE_URL}/animais`, ({ request }) => {
        const pendencia = new URL(request.url).searchParams.get('pendencia')
        const itens = pendencia === 'ficha_incompleta' ? [{ id: 'x1', nome: 'Tobias' }, { id: 'x2', nome: 'Pipoca' }] : []
        return HttpResponse.json({ itens, pagina: 0, tamanho: 3, totalItens: pendencia === 'ficha_incompleta' ? 5 : 0, totalPaginas: 1 })
      }),
    )
    const user = userEvent.setup()
    renderDashboard()

    const titulo = await screen.findByRole('link', { name: '5 animais com ficha incompleta' })
    expect(titulo).toHaveAttribute('href', '/animais?pendencia=ficha_incompleta')
    const item = titulo.closest('li.pendencia') as HTMLElement
    expect(within(item).getByRole('link', { name: 'Tobias' })).toHaveAttribute('href', '/animais/x1')
    expect(item).toHaveTextContent('e mais 3')
    expect(screen.queryByText(/sem avaliação clínica/)).not.toBeInTheDocument()

    await user.click(within(item).getByText(/sem microchip ou sem vacinação vigente/))
    expect(await screen.findByText('Tela de animais')).toBeInTheDocument()
  })

  it('perfil sem acesso a ocorrências não consulta nem mostra pendências de ocorrência', async () => {
    const consultas: string[] = []
    server.use(
      http.get(`${API_BASE_URL}/ocorrencias`, ({ request }) => {
        consultas.push(request.url)
        return HttpResponse.json({ itens: [], pagina: 0, tamanho: 3, totalItens: 9, totalPaginas: 1 })
      }),
    )
    renderDashboard('vet')

    await screen.findByText('147')
    expect(consultas).toHaveLength(0)
    expect(screen.queryByText(/ocorrências abertas/)).not.toBeInTheDocument()
  })

  it('alerta de vacina mostra a severidade com ícone e texto (vencida antes de a vencer)', async () => {
    const { container } = renderDashboard()

    await screen.findByText(/com reforço pendente/)
    await waitFor(() => expect(container.querySelector('.severidade-vencida')).not.toBeNull())
    expect(container.querySelector('.severidade-a-vencer')).not.toBeNull()
  })

  it('alerta de processos urgentes mostra o protocolo (fixture padrão: 1 urgente) e nunca dado de denunciante', async () => {
    renderDashboard()

    const link = await screen.findByRole('link', { name: '045/2026 (Raiva)' })
    expect(link).toHaveAttribute('href', expect.stringContaining('/processos/'))

    const alertaProcessos = link.closest('.pendencia') as HTMLElement
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

  it('processos urgentes somem da lista quando não há nenhum urgente', async () => {
    server.use(
      http.get(`${API_BASE_URL}/processos`, ({ request }) => {
        const pedeUrgentes = new URL(request.url).searchParams.get('urgente') === 'true'
        const itens = pedeUrgentes ? [] : [processoResumo({ id: '1', protocolo: '001/2026', urgente: false })]
        return HttpResponse.json({ itens, pagina: 0, tamanho: 50, totalItens: itens.length, totalPaginas: 1 })
      }),
    )
    renderDashboard()

    await screen.findByText('147')
    await waitFor(() => expect(screen.queryByText(/carregando/i)).not.toBeInTheDocument())
    expect(screen.queryByText(/processos? urgentes?/)).not.toBeInTheDocument()
  })

  it('card de esterilização pendente mostra o tempo desde a entrada e leva à ficha do animal', async () => {
    server.use(
      http.get(`${API_BASE_URL}/alertas/esterilizacao`, () =>
        HttpResponse.json([
          {
            animalId: 'a1',
            animalNome: 'Bidu',
            animalMicrochip: null,
            animalEspecieNome: 'Canino',
            animalSexo: 'macho',
            animalBaiaNome: null,
            animalStatusNome: 'Em tratamento',
            dataEntrada: '2026-01-01T09:00:00',
            horasDesdeEntrada: 100,
          },
        ]),
      ),
    )
    renderDashboard()

    const titulo = await screen.findByRole('link', { name: /recolhido há mais de 72 horas sem esterilização/ })
    const item = titulo.closest('li.pendencia') as HTMLElement
    expect(within(item).getByRole('link', { name: 'Bidu' })).toHaveAttribute('href', '/animais/a1')
    expect(item).toHaveTextContent('Bidu (há 4 dias)')
    expect(screen.getByRole('link', { name: /recolhido há mais de 72 horas sem esterilização/ })).toHaveAttribute(
      'href',
      '/alertas/esterilizacao',
    )
  })

  it('Agente Sanitário não vê o card de esterilização pendente', async () => {
    let consultou = false
    server.use(
      http.get(`${API_BASE_URL}/alertas/esterilizacao`, () => {
        consultou = true
        return HttpResponse.json([])
      }),
    )
    renderDashboard('agente')

    expect(await screen.findByRole('link', { name: '045/2026 (Raiva)' })).toBeInTheDocument()
    expect(screen.queryByText(/sem esterilização/)).not.toBeInTheDocument()
    expect(consultou).toBe(false)
  })

  it('card de esterilização pendente não aparece quando nenhum animal passou de 72 horas', async () => {
    server.use(http.get(`${API_BASE_URL}/alertas/esterilizacao`, () => HttpResponse.json([])))
    renderDashboard()

    await screen.findByText('147')
    expect(screen.queryByText(/sem esterilização/)).not.toBeInTheDocument()
  })
})
