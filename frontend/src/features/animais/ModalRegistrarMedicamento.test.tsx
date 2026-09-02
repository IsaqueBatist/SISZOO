import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AuthProvider, SESSION_STORAGE_KEY } from '../auth/AuthContext'
import type { Usuario } from '../auth/auth.types'
import { AbaMedicamentos } from './AbaMedicamentos'

const REX_ID = 'b2c3d4e5-0000-0000-0000-000000000001'
const MEDICAMENTO_FENOBARBITAL_ID = 'f3000000-0000-0000-0000-000000000001'

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
          <AbaMedicamentos animalId={REX_ID} onRegistroCriado={() => {}} />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('ModalRegistrarMedicamento', () => {
  it('registra uma nova prescrição e o card reflete o novo registro', async () => {
    const user = userEvent.setup()
    renderAba()

    await screen.findByText('Fenobarbital 30mg')
    await user.click(screen.getByRole('button', { name: /registrar medicamento/i }))

    const modal = screen.getByRole('heading', { name: 'Registrar medicamento' }).closest<HTMLElement>('.modal')
    if (!modal) throw new Error('modal não encontrado')

    await user.selectOptions(await within(modal).findByLabelText(/medicamento/i), 'Amoxicilina 250mg')
    await user.type(within(modal).getByLabelText(/^início/i), '2026-05-01')
    await user.type(within(modal).getByLabelText(/frequência/i), '3')
    await user.selectOptions(within(modal).getByLabelText(/a cada/i), 'HORAS')
    await user.type(within(modal).getByLabelText(/^dose/i), '10')
    await user.selectOptions(within(modal).getByLabelText(/^unidade/i), 'MILIGRAMA')
    await user.selectOptions(within(modal).getByLabelText(/^via/i), 'ORAL')
    await user.click(within(modal).getByRole('button', { name: /^registrar medicamento$/i }))

    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Registrar medicamento' })).not.toBeInTheDocument())
    expect(await screen.findByText('Amoxicilina 250mg')).toBeInTheDocument()
  })

  it('exige medicamento, início, frequência, unidade de frequência, dose, unidade da dose e via', async () => {
    const user = userEvent.setup()
    renderAba()

    await screen.findByText('Fenobarbital 30mg')
    await user.click(screen.getByRole('button', { name: /registrar medicamento/i }))

    const modal = screen.getByRole('heading', { name: 'Registrar medicamento' }).closest<HTMLElement>('.modal')
    if (!modal) throw new Error('modal não encontrado')
    await user.click(within(modal).getByRole('button', { name: /^registrar medicamento$/i }))

    expect(await within(modal).findByText('Selecione o medicamento.')).toBeInTheDocument()
    expect(within(modal).getByText('Informe a data de início.')).toBeInTheDocument()
    expect(within(modal).getByText('Informe a frequência.')).toBeInTheDocument()
    expect(within(modal).getByText('Selecione a unidade.')).toBeInTheDocument()
    expect(within(modal).getByText('Informe a quantidade da dose.')).toBeInTheDocument()
    expect(within(modal).getByText('Selecione a unidade da dose.')).toBeInTheDocument()
    expect(within(modal).getByText('Selecione a via de administração.')).toBeInTheDocument()
  })

  it('pré-seleciona o medicamento correto ao corrigir uma prescrição existente (retifica)', async () => {
    const user = userEvent.setup()
    renderAba()

    const cardFenobarbital = (await screen.findByText('Fenobarbital 30mg')).closest('.med-card')
    if (!cardFenobarbital) throw new Error('card não encontrado')
    await user.click(within(cardFenobarbital).getByRole('button', { name: /corrigir/i }))

    const modal = screen.getByRole('heading', { name: 'Corrigir prescrição' }).closest<HTMLElement>('.modal')
    if (!modal) throw new Error('modal não encontrado')
    expect(within(modal).getByText(/também usado.*mudar o status/i)).toBeInTheDocument()

    // O <select> de medicamento é populado por uma query assíncrona
    // (useMedicamentosAtivosQuery) — a pré-seleção do medicamentoId da
    // retifica só pode ser confirmada depois que as opções carregarem.
    await waitFor(() => {
      expect(within(modal).getByLabelText(/medicamento/i)).toHaveValue(MEDICAMENTO_FENOBARBITAL_ID)
    })

    await user.selectOptions(within(modal).getByLabelText(/^status/i), 'SUSPENSA')
    await user.click(within(modal).getByRole('button', { name: /^salvar correção$/i }))

    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Corrigir prescrição' })).not.toBeInTheDocument())
    const cardsFenobarbital = (await screen.findAllByText('Fenobarbital 30mg')).map((titulo) => titulo.closest('.med-card'))
    const comBadgeRetificado = cardsFenobarbital.filter(
      (card): card is HTMLElement => card !== null && within(card).queryByText('Retificado') !== null,
    )
    expect(comBadgeRetificado).toHaveLength(1)
  })
})
