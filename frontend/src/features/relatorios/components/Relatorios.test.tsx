import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { API_BASE_URL } from '@/lib/env'
import { previewAnualProcessosFixture, previewOcupacaoBaiasFixture, TIPOS_RELATORIO_FIXTURE } from '@/mocks/relatoriosFixtures'
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

  it('bloqueia "Gerar relatório" com período invertido e não chama a API', async () => {
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

    await user.click(within(cardVacinacao).getByRole('button', { name: 'Gerar relatório' }))

    expect(await within(cardVacinacao).findByText(/data final deve ser maior ou igual/i)).toBeInTheDocument()
    expect(chamouPreview).toBe(false)
  })

  it('Veterinário: sem o card de ocorrências por bairro, e o histórico não oferece gerar de novo esse tipo', async () => {
    const tiposSemBairro = TIPOS_RELATORIO_FIXTURE.filter((tipo) => tipo.codigo !== 'ocorrencias_bairro')
    server.use(
      http.get(`${API_BASE_URL}/relatorios/tipos`, () => HttpResponse.json(tiposSemBairro)),
      http.get(`${API_BASE_URL}/relatorios/historico`, () =>
        HttpResponse.json({
          itens: [
            {
              docId: 'DOC-2026-0001',
              tipo: 'ocorrencias_bairro',
              tipoNomeExibicao: 'Ocorrências por Bairro',
              periodoInicio: '2026-01-01',
              periodoFim: '2026-03-31',
              parametrosJson: JSON.stringify({ tipo: 'ocorrencias_bairro', periodoInicio: '2026-01-01', periodoFim: '2026-03-31' }),
              geradoPorNome: 'Ana Silva',
              geradoEm: '2026-04-01T10:00:00Z',
              tamanhoBytes: 2048,
            },
          ],
          pagina: 0,
          tamanho: 10,
          totalItens: 1,
          totalPaginas: 1,
        }),
      ),
    )
    renderRelatorios()

    await screen.findByRole('heading', { level: 3, name: 'Ocupação de Baias' })
    expect(screen.queryByRole('heading', { level: 3, name: /por bairro/i })).not.toBeInTheDocument()
    expect(await screen.findByText('Ana Silva')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Gerar novamente' })).not.toBeInTheDocument()
  })

  it('relatório anual sem bairros (Veterinário) não mostra a seção', async () => {
    const user = userEvent.setup()
    server.use(
      http.get(`${API_BASE_URL}/relatorios/preview`, () => HttpResponse.json({ ...previewAnualProcessosFixture(), bairros: null })),
    )
    renderRelatorios()

    const cardAnual = (
      await screen.findByRole('heading', { level: 3, name: /anual/i })
    ).closest('.report-card') as HTMLElement
    await user.click(within(cardAnual).getByRole('button', { name: 'Gerar relatório' }))

    expect(await screen.findByRole('heading', { name: /laboratórios utilizados/i })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /bairros com mais ocorrências/i })).not.toBeInTheDocument()
  })

  it('gera o preview de Ocupação de Baias e exibe os KPIs e a tabela', async () => {
    const user = userEvent.setup()
    renderRelatorios()

    const cardOcupacao = (
      await screen.findByRole('heading', { level: 3, name: 'Ocupação de Baias' })
    ).closest('.report-card') as HTMLElement
    await user.click(within(cardOcupacao).getByRole('button', { name: 'Gerar relatório' }))

    expect(await screen.findByText('Baia 3')).toBeInTheDocument()
    expect(screen.getByText('Superlotada')).toBeInTheDocument()
    expect(screen.getByText('Próximo do limite')).toBeInTheDocument()
    expect(screen.getByText('Posição em 10/09/2026')).toBeInTheDocument()
  })

  it('Adoções e Ocupação não pedem período e geram sem filtro', async () => {
    const user = userEvent.setup()
    const pedidos: URLSearchParams[] = []
    server.use(
      http.get(`${API_BASE_URL}/relatorios/preview`, ({ request }) => {
        pedidos.push(new URL(request.url).searchParams)
        return HttpResponse.json(previewOcupacaoBaiasFixture())
      }),
    )
    renderRelatorios()

    const cardOcupacao = (
      await screen.findByRole('heading', { level: 3, name: 'Ocupação de Baias' })
    ).closest('.report-card') as HTMLElement
    const cardAdocoes = screen
      .getByRole('heading', { level: 3, name: 'Relatório de Adoções' })
      .closest('.report-card') as HTMLElement

    for (const card of [cardOcupacao, cardAdocoes]) {
      expect(within(card).getByText(/^Posição em \d{2}\/\d{2}\/\d{4}$/)).toBeInTheDocument()
      expect(card.querySelector('input, select')).toBeNull()
    }

    await user.click(within(cardOcupacao).getByRole('button', { name: 'Gerar relatório' }))

    await screen.findByText('Baia 3')
    expect([...pedidos[0].keys()]).toEqual(['tipo'])
  })

  it('histórico antigo de relatório de posição mostra a data da geração e gera de novo sem o período antigo', async () => {
    const user = userEvent.setup()
    const pedidos: URLSearchParams[] = []
    server.use(
      http.get(`${API_BASE_URL}/relatorios/historico`, () =>
        HttpResponse.json({
          itens: [
            {
              docId: 'DOC-2026-0002',
              tipo: 'ocupacao_baias',
              tipoNomeExibicao: 'Ocupação de Baias',
              periodoInicio: '2026-03-10',
              periodoFim: '2026-09-10',
              parametrosJson: JSON.stringify({ tipo: 'ocupacao_baias', janela: 'ultimos_6_meses' }),
              geradoPorNome: 'Ana Silva',
              geradoEm: '2026-09-10T15:00:00-03:00',
              tamanhoBytes: 2048,
            },
          ],
          pagina: 0,
          tamanho: 10,
          totalItens: 1,
          totalPaginas: 1,
        }),
      ),
      http.get(`${API_BASE_URL}/relatorios/preview`, ({ request }) => {
        pedidos.push(new URL(request.url).searchParams)
        return HttpResponse.json(previewOcupacaoBaiasFixture())
      }),
    )
    renderRelatorios()

    const linha = (await screen.findByText('Ana Silva')).closest('tr') as HTMLElement
    expect(within(linha).getByText('Posição em 10/09/2026')).toBeInTheDocument()

    await user.click(within(linha).getByRole('button', { name: 'Gerar novamente' }))

    await screen.findByText('Baia 3')
    expect([...pedidos[0].keys()]).toEqual(['tipo'])
  })

  it('gera o preview de Adoções e exibe a nota de limitação e o perfil', async () => {
    const user = userEvent.setup()
    renderRelatorios()

    const cardAdocoes = (
      await screen.findByRole('heading', { level: 3, name: 'Relatório de Adoções' })
    ).closest('.report-card') as HTMLElement
    await user.click(within(cardAdocoes).getByRole('button', { name: 'Gerar relatório' }))

    expect(await screen.findByText(/não é um histórico por período/i)).toBeInTheDocument()
    expect(screen.getByText('Posição em 10/09/2026')).toBeInTheDocument()
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
      await user.click(within(cardOcupacao).getByRole('button', { name: 'Gerar relatório' }))
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

    expect(await screen.findByRole('heading', { level: 2, name: 'Relatório de Vacinação' })).toBeInTheDocument()
    expect(await screen.findByText('487')).toBeInTheDocument()
  })
})
