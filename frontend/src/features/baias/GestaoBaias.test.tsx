import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider, SESSION_STORAGE_KEY } from '../auth/AuthContext'
import type { Usuario } from '../auth/auth.types'
import { GestaoBaias } from './GestaoBaias'

function renderGestaoBaias(cargos: string[] = ['Administrador']) {
  const usuario: Usuario = {
    id: 'a1b2c3d4-0000-0000-0000-000000000099',
    nome: 'Ana',
    sobrenome: 'Silva',
    email: 'ana.silva@itu.sp.gov.br',
    cargos,
    senhaAlteradaEm: '2026-01-10T12:00:00Z',
  }
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ token: 'token-existente', usuario }))

  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AuthProvider>
          <GestaoBaias />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('GestaoBaias', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('carrega e agrupa as baias ativas por tipo, com os totais do header', async () => {
    renderGestaoBaias()

    expect(await screen.findByText('6 baias · 6 animais')).toBeInTheDocument()
    expect(
      screen.getByText('Capacidade total: 15 vagas · Taxa de ocupação geral: 40% · 1 baia(s) superlotada(s)'),
    ).toBeInTheDocument()

    const secaoCanil = screen.getByRole('heading', { name: /^canil/i }).closest('.baia-section') as HTMLElement
    const secaoGatil = screen.getByRole('heading', { name: /^gatil/i }).closest('.baia-section') as HTMLElement
    if (!secaoCanil || !secaoGatil) throw new Error('seção não encontrada')
    expect(within(secaoCanil).getByText('5 baia(s)')).toBeInTheDocument()
    expect(within(secaoGatil).getByText('1 baia(s)')).toBeInTheDocument()

    // Baia Interditada é inativa — some do filtro padrão ("Ativas").
    expect(screen.queryByText('Baia Interditada')).not.toBeInTheDocument()
  })

  it('destaca a baia superlotada com classe e label, e não destaca uma baia normal', async () => {
    renderGestaoBaias()

    const cardSuperlotada = (await screen.findByText('Baia 9')).closest('.baia-card')
    const cardNormal = screen.getByText('Baia 3').closest('.baia-card')
    if (!cardSuperlotada || !cardNormal) throw new Error('card não encontrado')

    expect(cardSuperlotada).toHaveClass('danger')
    expect(within(cardSuperlotada as HTMLElement).getByText('Superlotada')).toBeInTheDocument()
    expect(cardNormal).not.toHaveClass('danger')
    expect(cardNormal).not.toHaveClass('warn')
  })

  it('filtra por tipo', async () => {
    const user = userEvent.setup()
    renderGestaoBaias()

    await screen.findByText('Baia 3')
    await user.selectOptions(screen.getByLabelText(/filtrar por tipo/i), 'gatil')

    expect(screen.queryByText('Baia 3')).not.toBeInTheDocument()
    expect(screen.getByText('Gatil A')).toBeInTheDocument()
  })

  it('filtra por estado de lotação', async () => {
    const user = userEvent.setup()
    renderGestaoBaias()

    await screen.findByText('Baia 3')
    await user.selectOptions(screen.getByLabelText(/filtrar por lotação/i), 'superlotada')

    expect(screen.queryByText('Baia 3')).not.toBeInTheDocument()
    expect(screen.getByText('Baia 9')).toBeInTheDocument()
  })

  it('filtra por status: baia inativa some do padrão e aparece ao trocar para "Inativas"', async () => {
    const user = userEvent.setup()
    renderGestaoBaias()

    await screen.findByText('Baia 3')
    expect(screen.queryByText('Baia Interditada')).not.toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText(/filtrar por status/i), 'inativas')

    expect(await screen.findByText('Baia Interditada')).toBeInTheDocument()
    expect(screen.queryByText('Baia 3')).not.toBeInTheDocument()
  })

  it('cria uma baia nova', async () => {
    const user = userEvent.setup()
    renderGestaoBaias()

    await screen.findByText('Baia 3')
    await user.click(screen.getByRole('button', { name: /adicionar baia/i }))

    await user.type(screen.getByLabelText(/^nome/i), 'Baia Nova')
    await user.selectOptions(screen.getByLabelText(/^tipo/i), 'canil')
    await user.type(screen.getByLabelText(/capacidade/i), '5')
    await user.click(screen.getByRole('button', { name: /^criar baia$/i }))

    expect(await screen.findByText('Baia Nova')).toBeInTheDocument()
  })

  it('capacidade vazia mostra "informe a capacidade" em vez de aceitar como zero', async () => {
    const user = userEvent.setup()
    renderGestaoBaias()

    await screen.findByText('Baia 3')
    await user.click(screen.getByRole('button', { name: /adicionar baia/i }))

    await user.type(screen.getByLabelText(/^nome/i), 'Baia Sem Capacidade')
    await user.selectOptions(screen.getByLabelText(/^tipo/i), 'canil')
    await user.click(screen.getByRole('button', { name: /^criar baia$/i }))

    expect(await screen.findByText('Informe a capacidade.')).toBeInTheDocument()
    expect(screen.queryByText('Baia Sem Capacidade')).not.toBeInTheDocument()
  })

  it('edita a capacidade de uma baia existente', async () => {
    const user = userEvent.setup()
    renderGestaoBaias()

    const cardBaia3 = (await screen.findByText('Baia 3')).closest('.baia-card') as HTMLElement
    await user.click(within(cardBaia3).getByRole('button', { name: /editar/i }))

    const campoCapacidade = screen.getByLabelText(/capacidade/i)
    await user.clear(campoCapacidade)
    await user.type(campoCapacidade, '5')
    await user.click(screen.getByRole('button', { name: /^salvar$/i }))

    await waitFor(() => {
      const cardAtualizado = screen.getByText('Baia 3').closest('.baia-card') as HTMLElement
      expect(within(cardAtualizado).getByText('1/5')).toBeInTheDocument()
    })
  })

  it('exclui uma baia sem animais alocados ao confirmar', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const user = userEvent.setup()
    renderGestaoBaias()

    const cardBaia10 = (await screen.findByText('Baia 10')).closest('.baia-card') as HTMLElement
    await user.click(within(cardBaia10).getByRole('button', { name: /excluir/i }))

    expect(window.confirm).toHaveBeenCalledWith(expect.not.stringContaining('animal(is) alocado'))
    await waitFor(() => {
      expect(screen.queryByText('Baia 10')).not.toBeInTheDocument()
    })
  })

  it('avisa a quantidade de animais alocados ao excluir uma baia ocupada, mas não bloqueia a exclusão', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const user = userEvent.setup()
    renderGestaoBaias()

    const cardBaia3 = (await screen.findByText('Baia 3')).closest('.baia-card') as HTMLElement
    await user.click(within(cardBaia3).getByRole('button', { name: /excluir/i }))

    expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('1 animal(is) alocado(s)'))
    await waitFor(() => {
      expect(screen.queryByText('Baia 3')).not.toBeInTheDocument()
    })
  })

  it('não exclui a baia quando o usuário cancela a confirmação', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    const user = userEvent.setup()
    renderGestaoBaias()

    const cardBaia3 = (await screen.findByText('Baia 3')).closest('.baia-card') as HTMLElement
    await user.click(within(cardBaia3).getByRole('button', { name: /excluir/i }))

    expect(screen.getByText('Baia 3')).toBeInTheDocument()
  })

  it('reativa uma baia inativa', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const user = userEvent.setup()
    renderGestaoBaias()

    await user.selectOptions(await screen.findByLabelText(/filtrar por status/i), 'inativas')
    const cardInterditada = (await screen.findByText('Baia Interditada')).closest('.baia-card') as HTMLElement
    await user.click(within(cardInterditada).getByRole('button', { name: /reativar/i }))

    await user.selectOptions(screen.getByLabelText(/filtrar por status/i), 'ativas')
    expect(await screen.findByText('Baia Interditada')).toBeInTheDocument()
  })

  it('o link "Ver animais" aponta para a listagem de animais filtrada pela baia', async () => {
    renderGestaoBaias()

    const cardBaia3 = (await screen.findByText('Baia 3')).closest('.baia-card') as HTMLElement
    const link = within(cardBaia3).getByRole('link', { name: /ver animais/i })
    expect(link).toHaveAttribute('href', '/animais?baiaId=c3d4e5f6-0000-0000-0000-000000000001')
  })

  it('Agente Sanitário não vê botões de CRUD', async () => {
    renderGestaoBaias(['Agente Sanitário'])

    const cardBaia3 = (await screen.findByText('Baia 3')).closest('.baia-card') as HTMLElement
    expect(screen.queryByRole('button', { name: /adicionar baia/i })).not.toBeInTheDocument()
    expect(within(cardBaia3).queryByRole('button', { name: /editar/i })).not.toBeInTheDocument()
    expect(within(cardBaia3).queryByRole('button', { name: /excluir/i })).not.toBeInTheDocument()
  })

  it('Veterinário edita mas não exclui', async () => {
    renderGestaoBaias(['Veterinário'])

    const cardBaia3 = (await screen.findByText('Baia 3')).closest('.baia-card') as HTMLElement
    expect(within(cardBaia3).getByRole('button', { name: /editar/i })).toBeInTheDocument()
    expect(within(cardBaia3).queryByRole('button', { name: /excluir/i })).not.toBeInTheDocument()
  })

  it('Administrador vê editar e excluir', async () => {
    renderGestaoBaias(['Administrador'])

    const cardBaia3 = (await screen.findByText('Baia 3')).closest('.baia-card') as HTMLElement
    expect(within(cardBaia3).getByRole('button', { name: /editar/i })).toBeInTheDocument()
    expect(within(cardBaia3).getByRole('button', { name: /excluir/i })).toBeInTheDocument()
  })
})
