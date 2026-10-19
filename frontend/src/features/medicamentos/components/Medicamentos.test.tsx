import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
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
        <AuthProvider>
          <Medicamentos />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('Medicamentos', () => {
  it('cadastra uma categoria nova, já a escolhe e cadastra o medicamento na lista', async () => {
    const user = userEvent.setup()
    renderComCargo('Administrador')

    expect(await screen.findByText('Fenobarbital 30mg')).toBeInTheDocument()

    await user.type(screen.getByLabelText(/nova categoria farmacológica/i), 'Anti-inflamatório')
    await user.click(screen.getByRole('button', { name: /adicionar categoria/i }))
    await within(screen.getByLabelText(/^categoria farmacológica/i)).findByRole('option', { name: 'Anti-inflamatório' })
    expect(screen.getByLabelText(/^categoria farmacológica/i)).toHaveDisplayValue('Anti-inflamatório')

    await user.type(screen.getByLabelText(/^nome/i), 'Meloxicam 2mg')
    await user.click(screen.getByRole('button', { name: /cadastrar medicamento/i }))

    expect(await screen.findByRole('cell', { name: 'Meloxicam 2mg' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Meloxicam 2mg cadastrado.')
  })

  it('categoria repetida mostra o motivo do 409', async () => {
    const user = userEvent.setup()
    renderComCargo('Administrador')

    await user.type(await screen.findByLabelText(/nova categoria farmacológica/i), 'antibiótico')
    await user.click(screen.getByRole('button', { name: /adicionar categoria/i }))

    expect(await screen.findByText('Categoria farmacologica ja cadastrada')).toBeInTheDocument()
  })

  it('exige nome e categoria antes de enviar', async () => {
    const user = userEvent.setup()
    renderComCargo('Veterinário')

    await user.click(await screen.findByRole('button', { name: /cadastrar medicamento/i }))

    expect(await screen.findByText('Informe o nome do medicamento.')).toBeInTheDocument()
    expect(screen.getByText('Selecione a categoria.')).toBeInTheDocument()
  })

  it('Agente Sanitário vê o catálogo, sem o cadastro', async () => {
    renderComCargo('Agente Sanitário')

    expect(await screen.findByText('Amoxicilina 250mg')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /cadastrar medicamento/i })).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/nova categoria farmacológica/i)).not.toBeInTheDocument()
  })
})
