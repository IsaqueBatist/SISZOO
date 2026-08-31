import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { API_BASE_URL } from '../../lib/env'
import { server } from '../../mocks/server'
import { Animais } from './Animais'
import { badgeDeEspecie, badgeDeStatus } from './statusBadge'

function renderAnimais() {
  // retry: false evita que o teste de erro espere os retries automáticos do
  // TanStack Query (backoff de até alguns segundos) antes de isError virar true.
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <Animais />
    </QueryClientProvider>,
  )
}

describe('badgeDeStatus', () => {
  it('mapeia cada status do catálogo real para a classe e o rótulo corretos', () => {
    expect(badgeDeStatus('disponivel_adocao', 'Disponível')).toEqual({ classe: 'badge-available', label: 'Disponível' })
    expect(badgeDeStatus('em_tratamento', 'Em tratamento')).toEqual({ classe: 'badge-treatment', label: 'Em tratamento' })
    expect(badgeDeStatus('em_quarentena', 'Em quarentena')).toEqual({ classe: 'badge-quarantine', label: 'Em quarentena' })
    expect(badgeDeStatus('adotado', 'Adotado')).toEqual({ classe: 'badge-adopted', label: 'Adotado' })
    expect(badgeDeStatus('obito_natural', 'Óbito natural')).toEqual({ classe: 'badge-deceased', label: 'Falecido' })
    expect(badgeDeStatus('obito_eutanasia', 'Óbito eutanásia')).toEqual({ classe: 'badge-deceased', label: 'Falecido' })
    expect(badgeDeStatus('transferido', 'Transferido')).toEqual({ classe: 'badge-neutral', label: 'Transferido' })
  })

  it('cai no fallback neutro para um status desconhecido', () => {
    expect(badgeDeStatus('status_novo', 'Status Novo')).toEqual({ classe: 'badge-neutral', label: 'Status Novo' })
  })
})

describe('badgeDeEspecie', () => {
  it('mapeia canino e felino para as classes dedicadas', () => {
    expect(badgeDeEspecie('canino', 'Canino')).toEqual({ classe: 'badge-canine', label: 'Canino' })
    expect(badgeDeEspecie('felino', 'Felino')).toEqual({ classe: 'badge-feline', label: 'Felino' })
  })

  it('cai no fallback neutro para espécies sem badge dedicado', () => {
    expect(badgeDeEspecie('quiroptero', 'Quiróptero')).toEqual({ classe: 'badge-neutral', label: 'Quiróptero' })
    expect(badgeDeEspecie('pnh', 'Primata não-humano')).toEqual({ classe: 'badge-neutral', label: 'Primata não-humano' })
  })
})

describe('Animais', () => {
  it('lista os animais carregados da API', async () => {
    renderAnimais()

    expect(await screen.findByText('Rex')).toBeInTheDocument()
    expect(screen.getByText('Luna')).toBeInTheDocument()
  })

  it('exibe o badge de status correto, incluindo os dois tipos de óbito e o status sem classe dedicada', async () => {
    renderAnimais()

    const linhaAnita = (await screen.findByText('Anita')).closest('tr')
    const linhaThor = screen.getByText('Thor').closest('tr')
    const linhaNina = screen.getByText('Nina').closest('tr')
    if (!linhaAnita || !linhaThor || !linhaNina) throw new Error('linha não encontrada')

    expect(within(linhaAnita).getByText('Falecido').closest('.badge')).toHaveClass('badge-deceased')
    expect(within(linhaThor).getByText('Falecido').closest('.badge')).toHaveClass('badge-deceased')
    expect(within(linhaNina).getByText('Transferido').closest('.badge')).toHaveClass('badge-neutral')
  })

  it('filtra por status', async () => {
    const user = userEvent.setup()
    renderAnimais()

    await screen.findByText('Rex')
    await user.selectOptions(screen.getByLabelText(/filtrar por status/i), 'adotado')

    await waitFor(() => {
      expect(screen.queryByText('Rex')).not.toBeInTheDocument()
    })
    expect(screen.getByText('Mia')).toBeInTheDocument()
  })

  it('filtra por espécie', async () => {
    const user = userEvent.setup()
    renderAnimais()

    await screen.findByText('Rex')
    await user.selectOptions(screen.getByLabelText(/filtrar por espécie/i), 'felino')

    await waitFor(() => {
      expect(screen.queryByText('Rex')).not.toBeInTheDocument()
    })
    expect(screen.getByText('Luna')).toBeInTheDocument()
    expect(screen.getByText('Mia')).toBeInTheDocument()
  })

  it('exibe a baia de cada animal, com fallback para quem não está em nenhuma', async () => {
    renderAnimais()

    const linhaRex = (await screen.findByText('Rex')).closest('tr')
    const linhaMia = screen.getByText('Mia').closest('tr')
    if (!linhaRex || !linhaMia) throw new Error('linha não encontrada')

    expect(within(linhaRex).getByText('Baia 3')).toBeInTheDocument()
    // Mia está "adotado" e não tem baia (baiaId/baiaNome nulos no mock).
    expect(within(linhaMia).getByText('—')).toBeInTheDocument()
  })

  it('filtra por baia', async () => {
    const user = userEvent.setup()
    renderAnimais()

    await screen.findByText('Rex')
    await user.selectOptions(screen.getByLabelText(/filtrar por baia/i), 'c3d4e5f6-0000-0000-0000-000000000002')

    await waitFor(() => {
      expect(screen.queryByText('Rex')).not.toBeInTheDocument()
    })
    expect(screen.getByText('Luna')).toBeInTheDocument()
  })

  it('busca por nome', async () => {
    const user = userEvent.setup()
    renderAnimais()

    await screen.findByText('Rex')
    await user.type(screen.getByPlaceholderText(/buscar por nome ou microchip/i), 'Luna')

    // "Luna" já está na lista inicial (placeholderData mantém a página anterior
    // visível enquanto a busca debounced ainda não voltou) — a asserção que
    // realmente comprova que o filtro foi aplicado no servidor é "Rex" sumir.
    await waitFor(() => {
      expect(screen.queryByText('Rex')).not.toBeInTheDocument()
    })
    expect(screen.getByText('Luna')).toBeInTheDocument()
  })

  it('exibe estado vazio quando nenhum animal combina com o filtro', async () => {
    const user = userEvent.setup()
    renderAnimais()

    await screen.findByText('Rex')
    await user.type(screen.getByPlaceholderText(/buscar por nome ou microchip/i), 'nome-que-nao-existe')

    expect(await screen.findByText('Nenhum animal encontrado')).toBeInTheDocument()
  })

  it('exibe estado de erro quando a API falha', async () => {
    server.use(
      http.get(`${API_BASE_URL}/animais`, () => {
        return HttpResponse.json({ mensagem: 'Erro' }, { status: 500 })
      }),
    )
    renderAnimais()

    expect(await screen.findByText(/não foi possível carregar os animais/i)).toBeInTheDocument()
  })

  it('pagina os resultados no servidor ao clicar em Próximo', async () => {
    const user = userEvent.setup()
    renderAnimais()

    await screen.findByText('Rex')
    expect(screen.queryByText('Animal Filler 21')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /próximo/i }))

    expect(await screen.findByText('Animal Filler 21')).toBeInTheDocument()
    expect(screen.queryByText('Rex')).not.toBeInTheDocument()
  })
})
