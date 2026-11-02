import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { API_BASE_URL } from '@/lib/env'
import { server } from '@/mocks/server'
import { MenuNotificacoes } from './MenuNotificacoes'

function renderSino() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/dashboard" element={<MenuNotificacoes />} />
          <Route path="/alertas/vacinas" element={<p>Tela de alertas de vacina</p>} />
          <Route path="/processos" element={<p>Tela de processos</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function botaoDoSino() {
  return screen.getByRole('button', { name: /notificaç/i })
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('MenuNotificacoes', () => {
  it('mostra o ponto e a contagem de alertas ativos no rótulo', async () => {
    renderSino()

    const botao = await screen.findByRole('button', { name: /notificações: \d+ alerta/i })
    expect(botao.querySelector('.dot')).toBeInTheDocument()
  })

  it('abre ao clicar e lista os alertas, com os urgentes primeiro', async () => {
    const user = userEvent.setup()
    renderSino()
    await screen.findByRole('button', { name: /notificações: \d+ alerta/i })

    await user.click(botaoDoSino())

    const menu = screen.getByRole('menu', { name: /notificações/i })
    const itens = within(menu).getAllByRole('menuitem')
    expect(itens.length).toBeGreaterThan(0)
    expect(itens[0]).toHaveClass('urgent')
  })

  it('ArrowDown abre com o foco no primeiro item', async () => {
    const user = userEvent.setup()
    renderSino()
    await screen.findByRole('button', { name: /notificações: \d+ alerta/i })

    botaoDoSino().focus()
    await user.keyboard('{ArrowDown}')

    expect(screen.getByRole('menu', { name: /notificações/i })).toBeInTheDocument()
  })

  it('Esc fecha e devolve o foco ao botão', async () => {
    const user = userEvent.setup()
    renderSino()
    await screen.findByRole('button', { name: /notificações: \d+ alerta/i })

    await user.click(botaoDoSino())
    expect(screen.getByRole('menu', { name: /notificações/i })).toBeInTheDocument()

    await user.keyboard('{Escape}')

    expect(screen.queryByRole('menu', { name: /notificações/i })).not.toBeInTheDocument()
    expect(botaoDoSino()).toHaveFocus()
  })

  it('o alerta de vacina navega para o detalhe; o agregado não é link', async () => {
    const user = userEvent.setup()
    renderSino()
    await screen.findByRole('button', { name: /notificações: \d+ alerta/i })
    await user.click(botaoDoSino())

    const menu = screen.getByRole('menu', { name: /notificações/i })
    await within(menu).findByText(/vacina\(s\) vencida/i)

    const linkDaVacina = within(menu)
      .getAllByRole('menuitem')
      .find((item) => item.tagName === 'A' && /vacina/i.test(item.textContent ?? ''))
    const agregados = within(menu)
      .getAllByRole('menuitem')
      .filter((item) => item.tagName === 'DIV')
    if (!linkDaVacina) throw new Error('alerta de vacina não é link')
    expect(agregados.length).toBeGreaterThan(0)

    await user.click(linkDaVacina)
    expect(screen.getByText(/tela de alertas de vacina/i)).toBeInTheDocument()
  })

  it('sem alerta nenhum, não mostra ponto e diz que está tudo limpo', async () => {
    vi.stubEnv('VITE_USE_MOCK_KPIS', 'false')
    server.use(
      http.get(`${API_BASE_URL}/dashboard/kpis`, () =>
        HttpResponse.json({
          animais: { total: 0, caninos: 0, felinos: 0 },
          vacinacao: { percentualVacinados: 0, vacinados: 0, total: 0 },
          ocorrencias: { registradasHoje: 0 },
          adocoes: { adotados: 0, disponiveis: 0 },
          alertas: [],
        }),
      ),
      http.get(`${API_BASE_URL}/processos`, () =>
        HttpResponse.json({ itens: [], pagina: 0, tamanho: 10, totalItens: 0, totalPaginas: 1 }),
      ),
    )
    const user = userEvent.setup()
    renderSino()

    const botao = await screen.findByRole('button', { name: /^notificações$/i })
    expect(botao.querySelector('.dot')).not.toBeInTheDocument()

    await user.click(botao)
    expect(screen.getByText(/nenhum alerta no momento/i)).toBeInTheDocument()
  })
})
