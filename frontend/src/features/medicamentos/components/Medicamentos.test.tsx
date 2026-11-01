import { ToastProvider } from '@/components/toast/ToastProvider'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider, SESSION_STORAGE_KEY } from '@/features/auth/hooks/AuthContext'
import type { Usuario } from '@/features/auth/types/auth.types'
import { Medicamentos } from './Medicamentos'

function renderComCargo(cargo: string) {
  const usuario: Usuario = {
    id: 'a1b2c3d4-0000-0000-0000-000000000001',
    nome: 'Stéphanie',
    sobrenome: 'Lima',
    email: 'stephanie.lima@itu.sp.gov.br',
    cargos: [cargo],
    senhaAlteradaEm: '2026-01-10T12:00:00Z',
  }
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ token: 'token-existente', usuario }))
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>
        <ToastProvider>
          <AuthProvider>
            <Medicamentos />
          </AuthProvider>
        </ToastProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

// O cadastro vive num modal, como nas outras telas de lista.
async function abrirCadastro(user: ReturnType<typeof userEvent.setup>) {
  await screen.findByText('Fenobarbital 30mg')
  await user.click(screen.getByRole('button', { name: /cadastrar medicamento/i }))
  const modal = screen.getByRole('heading', { name: 'Cadastrar medicamento' }).closest<HTMLElement>('.modal')
  if (!modal) throw new Error('modal não encontrado')
  return modal
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Medicamentos', () => {
  it('lista o catálogo com a categoria e a situação', async () => {
    renderComCargo('Administrador')
    const linha = (await screen.findByText('Fenobarbital 30mg')).closest('tr') as HTMLElement
    expect(within(linha).getByText('Anticonvulsivante')).toBeInTheDocument()
    expect(within(linha).getByText('Ativo')).toBeInTheDocument()
  })

  it('cadastra uma categoria nova, já a escolhe e cadastra o medicamento na lista', async () => {
    const user = userEvent.setup()
    renderComCargo('Administrador')
    const modal = await abrirCadastro(user)

    await user.click(within(modal).getByRole('button', { name: /cadastrar nova categoria/i }))
    await user.type(within(modal).getByLabelText(/nome da categoria/i), 'Anti-inflamatório')
    await user.click(within(modal).getByRole('button', { name: /^cadastrar categoria$/i }))

    const select = within(modal).getByLabelText(/^categoria/i)
    await within(select).findByRole('option', { name: 'Anti-inflamatório' })
    expect(select).toHaveDisplayValue('Anti-inflamatório')

    await user.type(within(modal).getByLabelText(/^nome/i), 'Meloxicam 2mg')
    await user.click(within(modal).getByRole('button', { name: /^cadastrar medicamento$/i }))

    expect(await screen.findByRole('cell', { name: 'Meloxicam 2mg' })).toBeInTheDocument()
    expect(await screen.findByText('Meloxicam 2mg cadastrado.')).toBeInTheDocument()
  })

  it('categoria repetida mostra o motivo do 409', async () => {
    const user = userEvent.setup()
    renderComCargo('Administrador')
    const modal = await abrirCadastro(user)

    await user.click(within(modal).getByRole('button', { name: /cadastrar nova categoria/i }))
    await user.type(within(modal).getByLabelText(/nome da categoria/i), 'antibiótico')
    await user.click(within(modal).getByRole('button', { name: /^cadastrar categoria$/i }))

    expect(await within(modal).findByText('Categoria farmacologica ja cadastrada')).toBeInTheDocument()
  })

  it('exige nome e categoria antes de enviar', async () => {
    const user = userEvent.setup()
    renderComCargo('Veterinário')
    const modal = await abrirCadastro(user)

    await user.click(within(modal).getByRole('button', { name: /^cadastrar medicamento$/i }))

    expect(await within(modal).findByText('Informe o nome do medicamento.')).toBeInTheDocument()
    expect(within(modal).getByText('Selecione a categoria.')).toBeInTheDocument()
  })

  it('edita o nome e a categoria de um medicamento', async () => {
    const user = userEvent.setup()
    renderComCargo('Administrador')
    const linha = (await screen.findByText('Fenobarbital 30mg')).closest('tr') as HTMLElement

    await user.click(within(linha).getByRole('button', { name: /editar fenobarbital 30mg/i }))
    const modal = screen.getByRole('heading', { name: 'Editar medicamento' }).closest<HTMLElement>('.modal')
    if (!modal) throw new Error('modal não encontrado')

    await user.clear(within(modal).getByLabelText(/^nome/i))
    await user.type(within(modal).getByLabelText(/^nome/i), 'Fenobarbital 100mg')
    await user.click(within(modal).getByRole('button', { name: /salvar alterações/i }))

    expect(await screen.findByRole('cell', { name: 'Fenobarbital 100mg' })).toBeInTheDocument()
  })

  // Diferente da vacina, o medicamento não tem endpoint de reativação: a
  // confirmação precisa dizer que é definitivo.
  it('avisa que desativar medicamento não tem volta', async () => {
    const confirmar = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const user = userEvent.setup()
    renderComCargo('Administrador')
    const linha = (await screen.findByText('Fenobarbital 30mg')).closest('tr') as HTMLElement

    await user.click(within(linha).getByRole('button', { name: /^desativar$/i }))

    expect(confirmar.mock.calls[0][0]).toMatch(/não há como reativar/i)
    await waitFor(() => expect(screen.queryByText('Fenobarbital 30mg')).not.toBeInTheDocument())

    await user.selectOptions(screen.getByLabelText(/filtrar por situação/i), 'inativos')
    const linhaInativa = (await screen.findByText('Fenobarbital 30mg')).closest('tr') as HTMLElement
    expect(within(linhaInativa).getByText('Inativo')).toBeInTheDocument()
    expect(within(linhaInativa).getByText('Sem reativação')).toBeInTheDocument()
    expect(within(linhaInativa).queryByRole('button')).not.toBeInTheDocument()
  })

  it('filtra por categoria e por busca', async () => {
    const user = userEvent.setup()
    renderComCargo('Administrador')
    await screen.findByText('Fenobarbital 30mg')

    await user.selectOptions(screen.getByLabelText(/filtrar por categoria/i), 'Anticonvulsivante')
    expect(screen.getByText('Fenobarbital 30mg')).toBeInTheDocument()
    expect(screen.queryByText('Amoxicilina 250mg')).not.toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText(/filtrar por categoria/i), '')
    await user.type(screen.getByLabelText(/buscar por nome do medicamento/i), 'zzz')
    expect(await screen.findByText('Nenhum medicamento encontrado')).toBeInTheDocument()
  })

  it('Agente Sanitário vê o catálogo, sem cadastrar, editar ou desativar', async () => {
    renderComCargo('Agente Sanitário')

    expect(await screen.findByText('Amoxicilina 250mg')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /cadastrar medicamento/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /editar amoxicilina/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^desativar$/i })).not.toBeInTheDocument()
  })
})
