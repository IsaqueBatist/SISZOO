import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { API_BASE_URL } from '@/lib/env'
import { server } from '@/mocks/server'
import { Relatorios } from './Relatorios'

function renderRelatorios() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/relatorios']}>
        <Relatorios />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('Relatorios', () => {
  it('renderiza os 6 cards do catálogo', async () => {
    renderRelatorios()

    expect(await screen.findByRole('heading', { level: 3, name: 'Relatório Anual de Processos' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Relatório de Vacinação' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Relatório de Adoções' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Relatório de Procedimentos' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Ocupação de Baias' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Ocorrências por Bairro' })).toBeInTheDocument()
  })

  it('bloqueia "Gerar Relatório" com período invertido e não chama a API', async () => {
    const user = userEvent.setup()
    let chamouPreview = false
    server.use(
      http.get(`${API_BASE_URL}/relatorios/preview`, () => {
        chamouPreview = true
        return HttpResponse.json({})
      }),
    )
    renderRelatorios()

    const cardVacinacao = (
      await screen.findByRole('heading', { level: 3, name: 'Relatório de Vacinação' })
    ).closest('.report-card') as HTMLElement
    const [inicio, fim] = cardVacinacao.querySelectorAll('input[type="date"]')
    await user.clear(inicio)
    await user.type(inicio, '2026-09-10')
    await user.clear(fim)
    await user.type(fim, '2026-01-01')

    await user.click(within(cardVacinacao).getByRole('button', { name: 'Gerar Relatório' }))

    expect(await within(cardVacinacao).findByText(/data final deve ser maior ou igual/i)).toBeInTheDocument()
    expect(chamouPreview).toBe(false)
  })

  it('gera o preview de Ocupação de Baias e exibe os KPIs e a tabela', async () => {
    const user = userEvent.setup()
    renderRelatorios()

    const cardOcupacao = (
      await screen.findByRole('heading', { level: 3, name: 'Ocupação de Baias' })
    ).closest('.report-card') as HTMLElement
    await user.click(within(cardOcupacao).getByRole('button', { name: 'Gerar Relatório' }))

    expect(await screen.findByText('Baia 3')).toBeInTheDocument()
    expect(screen.getByText('Superlotada')).toBeInTheDocument()
    expect(screen.getByText('Próx. limite')).toBeInTheDocument()
  })

  it('gera o preview de Adoções e exibe a nota de limitação e o perfil', async () => {
    const user = userEvent.setup()
    renderRelatorios()

    const cardAdocoes = (
      await screen.findByRole('heading', { level: 3, name: 'Relatório de Adoções' })
    ).closest('.report-card') as HTMLElement
    await user.click(within(cardAdocoes).getByRole('button', { name: 'Gerar Relatório' }))

    expect(await screen.findByText(/não é filtrado pelo período selecionado/i)).toBeInTheDocument()
    expect(screen.getByText('Canino')).toBeInTheDocument()
  })

  describe('download', () => {
    const urlOriginal = { criar: URL.createObjectURL, revogar: URL.revokeObjectURL }
    afterEach(() => {
      URL.createObjectURL = urlOriginal.criar
      URL.revokeObjectURL = urlOriginal.revogar
    })

    it('baixa o CSV com o nome extraído do Content-Disposition', async () => {
      const user = userEvent.setup()
      const criar = vi.fn(() => 'blob:relatorio-1')
      const revogar = vi.fn()
      URL.createObjectURL = criar
      URL.revokeObjectURL = revogar
      const clique = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
      let nomeArquivoUsado: string | null = null
      vi.spyOn(HTMLAnchorElement.prototype, 'download', 'set').mockImplementation(function (valor: string) {
        nomeArquivoUsado = valor
      })

      renderRelatorios()
      const cardOcupacao = (
        await screen.findByRole('heading', { level: 3, name: 'Ocupação de Baias' })
      ).closest('.report-card') as HTMLElement
      await user.click(within(cardOcupacao).getByRole('button', { name: 'Gerar Relatório' }))
      await screen.findByText('Baia 3')

      await user.click(screen.getByRole('button', { name: 'Baixar CSV' }))

      await waitFor(() => expect(revogar).toHaveBeenCalledWith('blob:relatorio-1'))
      expect(criar).toHaveBeenCalledTimes(1)
      expect(clique).toHaveBeenCalledTimes(1)
      expect(nomeArquivoUsado).toBe('ocupacao_baias-2026-01-01_2026-09-10.csv')
    })
  })

  it('"Gerar novamente" no histórico reabre o preview do mesmo tipo', async () => {
    const user = userEvent.setup()
    renderRelatorios()

    await user.click(await screen.findByRole('button', { name: 'Gerar novamente' }))

    // level: 2 para o cabeçalho do painel de preview — distinto do h3 do card
    // e do texto puro da linha do histórico, que também têm o mesmo nome.
    expect(await screen.findByRole('heading', { level: 2, name: 'Relatório de Vacinação' })).toBeInTheDocument()
    // "487" (vacinas aplicadas) é único na tela — "Antirrábica" aparece duas
    // vezes (tabela de vacinas e de animais com vacina vencida).
    expect(await screen.findByText('487')).toBeInTheDocument()
  })
})
