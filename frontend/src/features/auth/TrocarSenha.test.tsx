import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import { TrocarSenha } from './TrocarSenha'
import { AuthProvider, SESSION_STORAGE_KEY } from './AuthContext'
import type { Usuario } from './auth.types'

const USUARIO_PRIMEIRO_ACESSO: Usuario = {
  id: 'a1b2c3d4-0000-0000-0000-000000000098',
  nome: 'Beatriz',
  sobrenome: 'Camargo',
  email: 'beatriz.camargo@itu.sp.gov.br',
  cargos: ['Administrador'],
  senhaAlteradaEm: null,
}

function renderTrocarSenha() {
  sessionStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify({ token: 'token-existente', usuario: USUARIO_PRIMEIRO_ACESSO }),
  )

  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/trocar-senha']}>
        <AuthProvider>
          <Routes>
            <Route path="/trocar-senha" element={<TrocarSenha />} />
            <Route path="/dashboard" element={<div>Dashboard</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('TrocarSenha', () => {
  it('rejeita senha curta ou confirmação divergente sem chamar a API', async () => {
    const user = userEvent.setup()
    renderTrocarSenha()

    await user.type(screen.getByLabelText(/^nova senha/i), '123')
    await user.type(screen.getByLabelText(/confirmar nova senha/i), '456')
    await user.click(screen.getByRole('button', { name: /salvar nova senha/i }))

    expect(await screen.findByText(/no mínimo 8 caracteres/i)).toBeInTheDocument()
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()
  })

  it('troca a senha com sucesso e navega para /dashboard', async () => {
    const user = userEvent.setup()
    renderTrocarSenha()

    await user.type(screen.getByLabelText(/^nova senha/i), 'nova-senha-forte')
    await user.type(screen.getByLabelText(/confirmar nova senha/i), 'nova-senha-forte')
    await user.click(screen.getByRole('button', { name: /salvar nova senha/i }))

    expect(await screen.findByText('Dashboard')).toBeInTheDocument()
  })
})
