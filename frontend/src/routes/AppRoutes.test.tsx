import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import { AppRoutes } from './AppRoutes'
import { AuthProvider, SESSION_STORAGE_KEY } from '../features/auth/AuthContext'
import { CREDENCIAIS_VALIDAS } from '../mocks/handlers'

function renderApp(initialEntry = '/login') {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('roteamento entre login e dashboard', () => {
  it('mostra a tela de login por padrão e navega para o dashboard ao entrar com credenciais válidas', async () => {
    const user = userEvent.setup()
    renderApp()

    expect(screen.getByLabelText(/e-mail institucional/i)).toBeInTheDocument()

    await user.type(screen.getByLabelText(/e-mail institucional/i), CREDENCIAIS_VALIDAS.email)
    await user.type(screen.getByLabelText(/^senha/i), CREDENCIAIS_VALIDAS.senha)
    await user.click(screen.getByRole('button', { name: /^entrar$/i }))

    expect(
      await screen.findByRole('heading', { name: /dashboard operacional/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /siszoo/i })).toBeInTheDocument()
  })

  it('mantém na tela de login e mostra erro com credenciais inválidas', async () => {
    const user = userEvent.setup()
    renderApp()

    await user.type(screen.getByLabelText(/e-mail institucional/i), CREDENCIAIS_VALIDAS.email)
    await user.type(screen.getByLabelText(/^senha/i), 'senha-errada')
    await user.click(screen.getByRole('button', { name: /^entrar$/i }))

    expect(await screen.findByText('E-mail ou senha inválidos.')).toBeInTheDocument()
    expect(screen.getByLabelText(/e-mail institucional/i)).toBeInTheDocument()
  })

  it('redireciona para /login ao acessar /dashboard diretamente sem sessão', async () => {
    renderApp('/dashboard')

    expect(await screen.findByLabelText(/e-mail institucional/i)).toBeInTheDocument()
  })

  it('mantém a sessão ao remontar com sessionStorage já preenchido (rehidratação)', async () => {
    sessionStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({
        token: 'token-existente',
        usuario: {
          id: 'a1b2c3d4-0000-0000-0000-000000000002',
          nome: 'Stéphanie',
          sobrenome: 'Lima',
          email: CREDENCIAIS_VALIDAS.email,
          cargos: ['Veterinário'],
          senhaAlteradaEm: '2026-01-10T12:00:00Z',
        },
      }),
    )

    renderApp('/dashboard')

    expect(
      await screen.findByRole('heading', { name: /dashboard operacional/i }),
    ).toBeInTheDocument()
  })
})
