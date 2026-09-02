import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AuthProvider, SESSION_STORAGE_KEY } from '../auth/AuthContext'
import type { Usuario } from '../auth/auth.types'
import { AbaVacinas } from './AbaVacinas'

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
          <AbaVacinas animalId={REX_ID} onRegistroCriado={() => {}} />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('ModalRegistrarVacina — retifica', () => {
  it('corrige uma vacinação existente sem alterar o original, deixando o número da dose em branco', async () => {
    const user = userEvent.setup()
    renderAba()

    const linhaOriginal = (await screen.findByText('V10')).closest('tr')
    if (!linhaOriginal) throw new Error('linha não encontrada')
    await user.click(within(linhaOriginal).getByRole('button', { name: /corrigir/i }))

    const modal = screen.getByRole('heading', { name: 'Corrigir vacinação' }).closest<HTMLElement>('.modal')
    if (!modal) throw new Error('modal não encontrado')
    expect(within(modal).getByText(/o registro original não será alterado/i)).toBeInTheDocument()
    expect(within(modal).getByLabelText(/número da dose/i)).toHaveValue(1)

    // Número da dose é opcional: apagar o valor não pode travar o submit.
    await user.clear(within(modal).getByLabelText(/número da dose/i))
    await user.clear(within(modal).getByLabelText(/^lote/i))
    await user.type(within(modal).getByLabelText(/^lote/i), 'LOTE-99')
    await user.click(within(modal).getByRole('button', { name: /^salvar correção$/i }))

    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Corrigir vacinação' })).not.toBeInTheDocument())

    const linhasV10 = await waitFor(() => {
      const linhas = screen.getAllByText('V10').map((celula) => celula.closest('tr'))
      expect(linhas).toHaveLength(2)
      return linhas
    })
    const comBadgeRetificado = linhasV10.filter(
      (linha): linha is HTMLTableRowElement => linha !== null && within(linha).queryByText('Retificado') !== null,
    )
    expect(comBadgeRetificado).toHaveLength(1)
  })
})
