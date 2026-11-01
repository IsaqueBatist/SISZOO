import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import { TrocarSenha } from './TrocarSenha'
import { AuthProvider, definirSessaoEmMemoria } from '../hooks/AuthContext'
import type { Usuario } from '../types/auth.types'

const USUARIO_PRIMEIRO_ACESSO: Usuario = {
  id: 'a1b2c3d4-0000-0000-0000-000000000098',
  nome: 'Beatriz',
  sobrenome: 'Camargo',
  email: 'beatriz.camargo@itu.sp.gov.br',
  cargos: ['Administrador'],
  senhaAlteradaEm: null,
}

function renderTrocarSenha() {
  definirSessaoEmMemoria({ token: 'token-existente', usuario: USUARIO_PRIMEIRO_ACESSO })

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

  it.each([
    ['somente-minusculas', /^Use ao menos 3 tipos de caractere/],
    ['Beatriz-2026!', /^A senha não pode conter partes do nome/],
    ['X1-beatriz.camargo', /^A senha não pode conter o nome da conta/],
  ])('recusa "%s" pela política de senha sem chamar a API', async (senha, mensagem) => {
    const user = userEvent.setup()
    renderTrocarSenha()

    await user.type(screen.getByLabelText(/^nova senha/i), senha)
    await user.type(screen.getByLabelText(/confirmar nova senha/i), senha)
    await user.click(screen.getByRole('button', { name: /salvar nova senha/i }))

    expect(await screen.findByText(mensagem)).toBeInTheDocument()
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()
  })

  it('a lista de critérios acompanha a senha digitada', async () => {
    const user = userEvent.setup()
    renderTrocarSenha()

    expect(screen.getByText(/ao menos 8 caracteres/i).closest('li')).toHaveClass('pendente')

    await user.type(screen.getByLabelText(/^nova senha/i), 'beatriz1')
    expect(screen.getByText(/ao menos 8 caracteres/i).closest('li')).toHaveClass('ok')
    expect(screen.getByText(/partes do seu nome/i).closest('li')).toHaveClass('falha')
    expect(screen.getByText(/3 tipos de caractere/i).closest('li')).toHaveClass('falha')

    await user.clear(screen.getByLabelText(/^nova senha/i))
    await user.type(screen.getByLabelText(/^nova senha/i), 'Nova-Senha-2026')
    expect(screen.getByText(/partes do seu nome/i).closest('li')).toHaveClass('ok')
    expect(screen.getByText(/3 tipos de caractere/i).closest('li')).toHaveClass('ok')
  })

  it('troca a senha com sucesso e navega para /dashboard', async () => {
    const user = userEvent.setup()
    renderTrocarSenha()

    await user.type(screen.getByLabelText(/^nova senha/i), 'Nova-Senha-2026')
    await user.type(screen.getByLabelText(/confirmar nova senha/i), 'Nova-Senha-2026')
    await user.click(screen.getByRole('button', { name: /salvar nova senha/i }))

    expect(await screen.findByText('Dashboard')).toBeInTheDocument()
  })
})
