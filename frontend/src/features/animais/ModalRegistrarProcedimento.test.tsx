import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AuthProvider, SESSION_STORAGE_KEY } from '../auth/AuthContext'
import type { Usuario } from '../auth/auth.types'
import { AbaProcedimentos } from './AbaProcedimentos'

const REX_ID = 'b2c3d4e5-0000-0000-0000-000000000001'

function renderAba() {
  const usuario: Usuario = {
    id: 'a1b2c3d4-0000-0000-0000-000000000001',
    nome: 'Stéphanie',
    sobrenome: 'Lima',
    email: 'stephanie.lima@itu.sp.gov.br',
    cargos: ['Administrador'],
    senhaAlteradaEm: '2026-01-10T12:00:00Z',
  }
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ token: 'token-existente', usuario }))

  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AuthProvider>
          <AbaProcedimentos animalId={REX_ID} onRegistroCriado={() => {}} />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('ModalRegistrarProcedimento', () => {
  it('registra um novo procedimento e a lista reflete o novo registro', async () => {
    const user = userEvent.setup()
    renderAba()

    await screen.findByText('Castração')
    await user.click(screen.getByRole('button', { name: /registrar procedimento/i }))

    const modal = screen.getByRole('heading', { name: 'Registrar procedimento' }).closest<HTMLElement>('.modal')
    if (!modal) throw new Error('modal não encontrado')

    await user.selectOptions(within(modal).getByLabelText(/tipo de procedimento/i), 'vacinacao')
    await user.type(within(modal).getByLabelText(/^data/i), '2026-05-01')
    await user.type(within(modal).getByLabelText(/descrição/i), 'Hemograma completo.')
    await user.click(within(modal).getByRole('button', { name: /^registrar procedimento$/i }))

    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Registrar procedimento' })).not.toBeInTheDocument())
    expect(await screen.findByText('Hemograma completo.')).toBeInTheDocument()
  })

  it('exige tipo de procedimento e data', async () => {
    const user = userEvent.setup()
    renderAba()

    await screen.findByText('Castração')
    await user.click(screen.getByRole('button', { name: /registrar procedimento/i }))

    const modal = screen.getByRole('heading', { name: 'Registrar procedimento' }).closest<HTMLElement>('.modal')
    if (!modal) throw new Error('modal não encontrado')
    await user.click(within(modal).getByRole('button', { name: /^registrar procedimento$/i }))

    expect(await screen.findByText('Selecione o tipo de procedimento.')).toBeInTheDocument()
    expect(screen.getByText('Informe a data.')).toBeInTheDocument()
  })

  it('corrige um procedimento existente sem alterar o original (retifica)', async () => {
    const user = userEvent.setup()
    renderAba()

    const linhaOriginal = (await screen.findByText('Atendimento clínico')).closest('tr')
    if (!linhaOriginal) throw new Error('linha não encontrada')
    await user.click(within(linhaOriginal).getByRole('button', { name: /corrigir/i }))

    const modal = screen.getByRole('heading', { name: 'Corrigir procedimento' }).closest<HTMLElement>('.modal')
    if (!modal) throw new Error('modal não encontrado')
    expect(within(modal).getByText(/o registro original não será alterado/i)).toBeInTheDocument()
    expect(within(modal).getByLabelText(/^data/i)).not.toHaveValue('')

    await user.clear(within(modal).getByLabelText(/resultado/i))
    await user.type(within(modal).getByLabelText(/resultado/i), 'Resultado corrigido.')
    await user.click(within(modal).getByRole('button', { name: /^salvar correção$/i }))

    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Corrigir procedimento' })).not.toBeInTheDocument())
    expect(await screen.findByText('Resultado corrigido.')).toBeInTheDocument()
    const linhasAtendimento = (await screen.findAllByText('Atendimento clínico')).map((celula) => celula.closest('tr'))
    const comBadgeRetificado = linhasAtendimento.filter(
      (linha): linha is HTMLTableRowElement => linha !== null && within(linha).queryByText('Retificado') !== null,
    )
    expect(comBadgeRetificado).toHaveLength(1)
  })
})
