import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Toasts } from '@/components/toast/Toasts'
import { AuthProvider, definirSessaoEmMemoria } from '@/features/auth/hooks/AuthContext'
import type { Usuario } from '@/features/auth/types/auth.types'
import { Vacinas } from './Vacinas'

function renderVacinas(cargos: string[] = ['Administrador']) {
  const usuario: Usuario = {
    id: 'a1b2c3d4-0000-0000-0000-000000000001',
    nome: 'Stéphanie',
    sobrenome: 'Lima',
    email: 'stephanie.lima@itu.sp.gov.br',
    cargos,
    senhaAlteradaEm: '2026-01-10T12:00:00Z',
  }
  definirSessaoEmMemoria({ token: 'token-existente', usuario })
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/vacinas']}>
          <AuthProvider>
            <Routes>
              <Route path="/vacinas" element={<Vacinas />} />
            </Routes>
          </AuthProvider>
      </MemoryRouter>
      <Toasts />
    </QueryClientProvider>,
  )
}

async function abrirCadastro(user: ReturnType<typeof userEvent.setup>) {
  await screen.findByText('Antirrábica')
  await user.click(screen.getByRole('button', { name: /cadastrar vacina/i }))
  const modal = screen.getByRole('heading', { name: 'Cadastrar vacina' }).closest<HTMLElement>('.modal')
  if (!modal) throw new Error('modal não encontrado')
  return modal
}

async function abrirEdicao(user: ReturnType<typeof userEvent.setup>, nomeDaVacina: string) {
  const linha = (await screen.findByText(nomeDaVacina)).closest('tr') as HTMLElement
  await user.click(within(linha).getByRole('button', { name: new RegExp(`editar ${nomeDaVacina}`, 'i') }))
  const modal = screen.getByRole('heading', { name: 'Editar vacina' }).closest<HTMLElement>('.modal')
  if (!modal) throw new Error('modal não encontrado')
  return modal
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Vacinas', () => {
  it('lista o catálogo com o intervalo de reforço', async () => {
    renderVacinas()
    const linha = (await screen.findByText('Antirrábica')).closest('tr') as HTMLElement
    expect(within(linha).getByText('12 meses')).toBeInTheDocument()
    expect(within(linha).getByText('Ativa')).toBeInTheDocument()
  })

  it('resume o catálogo acima da lista', async () => {
    renderVacinas()
    await screen.findByText('Antirrábica')
    const resumo = screen.getByText('No catálogo').closest('.resumo-card') as HTMLElement
    expect(within(resumo).getByText('8')).toBeInTheDocument()
  })

  it('cadastra uma vacina nova com intervalo', async () => {
    const user = userEvent.setup()
    renderVacinas()
    const modal = await abrirCadastro(user)

    await user.type(within(modal).getByLabelText(/^nome/i), 'Tríplice Felina')
    await user.type(within(modal).getByLabelText(/intervalo de reforço/i), '24')
    await user.click(within(modal).getByRole('button', { name: /^cadastrar vacina$/i }))

    expect(await screen.findByLabelText('Avisos')).toHaveTextContent('Tríplice Felina cadastrada.')
    const linha = (await screen.findByText('Tríplice Felina')).closest('tr') as HTMLElement
    expect(within(linha).getByText('24 meses')).toBeInTheDocument()
  })

  it('aceita vacina sem intervalo e deixa claro que ela não gera alerta', async () => {
    const user = userEvent.setup()
    renderVacinas()
    const modal = await abrirCadastro(user)

    await user.type(within(modal).getByLabelText(/^nome/i), 'Vacina Sem Reforco')
    await user.click(within(modal).getByRole('button', { name: /^cadastrar vacina$/i }))

    const linha = (await screen.findByText('Vacina Sem Reforco')).closest('tr') as HTMLElement
    expect(within(linha).getByText('Sem reforço')).toBeInTheDocument()
  })

  it('mostra o motivo quando o nome colide com uma vacina existente', async () => {
    const user = userEvent.setup()
    renderVacinas()
    const modal = await abrirCadastro(user)

    await user.type(within(modal).getByLabelText(/^nome/i), 'antirrabica')
    await user.click(within(modal).getByRole('button', { name: /^cadastrar vacina$/i }))

    expect(await within(modal).findByText(/Já existe a vacina "Antirrábica"/)).toBeInTheDocument()
  })

  it('renomeia uma vacina sem alterar o código', async () => {
    const user = userEvent.setup()
    renderVacinas()
    const modal = await abrirEdicao(user, 'Giárdia')

    expect(within(modal).getByLabelText(/^código/i)).toBeDisabled()
    expect(within(modal).getByLabelText(/^código/i)).toHaveValue('giardia')

    await user.clear(within(modal).getByLabelText(/^nome/i))
    await user.type(within(modal).getByLabelText(/^nome/i), 'Giárdia canina')
    await user.click(within(modal).getByRole('button', { name: /salvar alterações/i }))

    expect(await screen.findByText('Giárdia canina')).toBeInTheDocument()
  })

  it('avisa que mudar o intervalo afeta as aplicações já lançadas', async () => {
    const user = userEvent.setup()
    renderVacinas()
    const modal = await abrirEdicao(user, 'Antirrábica')

    expect(within(modal).queryByText(/muda a validade das aplicações já lançadas/i)).not.toBeInTheDocument()

    await user.clear(within(modal).getByLabelText(/intervalo de reforço/i))
    await user.type(within(modal).getByLabelText(/intervalo de reforço/i), '6')

    expect(await within(modal).findByText(/muda a validade das aplicações já lançadas/i)).toBeInTheDocument()
  })

  it('desativa e reativa uma vacina', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const user = userEvent.setup()
    renderVacinas()
    const linha = (await screen.findByText('Giárdia')).closest('tr') as HTMLElement

    await user.click(within(linha).getByRole('button', { name: /^desativar$/i }))
    await waitFor(() => expect(screen.queryByText('Giárdia')).not.toBeInTheDocument())

    await user.selectOptions(screen.getByLabelText(/filtrar por situação/i), 'inativas')
    const linhaInativa = (await screen.findByText('Giárdia')).closest('tr') as HTMLElement
    expect(within(linhaInativa).getByText('Inativa')).toBeInTheDocument()

    await user.click(within(linhaInativa).getByRole('button', { name: /reativar/i }))
    expect(await screen.findByLabelText('Avisos')).toHaveTextContent('Giárdia reativada.')
  })

  it('a busca filtra a lista e explica quando não há resultado', async () => {
    const user = userEvent.setup()
    renderVacinas()
    await screen.findByText('Antirrábica')

    await user.type(screen.getByLabelText(/buscar por nome da vacina/i), 'felv')
    expect(await screen.findByText('FeLV')).toBeInTheDocument()
    expect(screen.queryByText('Antirrábica')).not.toBeInTheDocument()

    await user.clear(screen.getByLabelText(/buscar por nome da vacina/i))
    await user.type(screen.getByLabelText(/buscar por nome da vacina/i), 'xyz')
    expect(await screen.findByText('Nenhuma vacina encontrada')).toBeInTheDocument()
  })

  it('a busca e o filtro sobrevivem a sair e voltar da tela', async () => {
    const user = userEvent.setup()
    const { unmount } = renderVacinas()
    await screen.findByText('Antirrábica')

    await user.type(screen.getByLabelText(/buscar por nome da vacina/i), 'felv')
    await user.selectOptions(screen.getByLabelText(/filtrar por situação/i), 'todas')
    unmount()

    renderVacinas()
    expect(await screen.findByLabelText(/buscar por nome da vacina/i)).toHaveValue('felv')
    expect(screen.getByLabelText(/filtrar por situação/i)).toHaveValue('todas')

    await user.click(screen.getByRole('button', { name: /limpar filtros/i }))
    expect(screen.getByLabelText(/buscar por nome da vacina/i)).toHaveValue('')
  })

  it('o Agente vê o catálogo mas não cadastra, edita nem desativa', async () => {
    renderVacinas(['Agente Sanitário'])
    await screen.findByText('Antirrábica')

    expect(screen.queryByRole('button', { name: /cadastrar vacina/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /editar antirrábica/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^desativar$/i })).not.toBeInTheDocument()
  })

  it('o Veterinário edita, mas não desativa', async () => {
    renderVacinas(['Veterinário'])
    await screen.findByText('Antirrábica')

    expect(screen.getByRole('button', { name: /cadastrar vacina/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /editar antirrábica/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^desativar$/i })).not.toBeInTheDocument()
  })
})
