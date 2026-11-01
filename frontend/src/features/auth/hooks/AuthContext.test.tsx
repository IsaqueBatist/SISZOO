import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'
import { AuthProvider, definirSessaoEmMemoria } from './AuthContext'
import { useAuth } from './useAuth'
import { CREDENCIAIS_VALIDAS } from '@/mocks/handlers'
import type { Usuario } from '../types/auth.types'

const USUARIO_EXEMPLO: Usuario = {
  id: 'a1b2c3d4-0000-0000-0000-000000000099',
  nome: 'Ana',
  sobrenome: 'Silva',
  email: 'ana.silva@itu.sp.gov.br',
  cargos: ['Administrador'],
  senhaAlteradaEm: null,
}

function Harness() {
  const { user, token, login, logout } = useAuth()
  return (
    <div>
      <span data-testid="token">{token ?? ''}</span>
      <span data-testid="user-email">{user?.email ?? ''}</span>
      <button onClick={() => login(CREDENCIAIS_VALIDAS)}>login</button>
      <button onClick={() => logout()}>logout</button>
    </div>
  )
}

function renderComRouter(initialEntry = '/protegida') {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<div>Tela de login</div>} />
            <Route path="/protegida" element={<Harness />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('AuthContext', () => {
  it('usa a sessão já em memória, sem esperar a renovação', () => {
    definirSessaoEmMemoria({ token: 'token-existente', usuario: USUARIO_EXEMPLO })

    renderComRouter()

    expect(screen.getByTestId('token')).toHaveTextContent('token-existente')
    expect(screen.getByTestId('user-email')).toHaveTextContent(USUARIO_EXEMPLO.email)
  })

  it('login bem-sucedido deixa token e usuário só em memória', async () => {
    const user = userEvent.setup()
    renderComRouter()

    await user.click(screen.getByRole('button', { name: 'login' }))

    await waitFor(() => expect(screen.getByTestId('token')).not.toHaveTextContent(''))

    expect(screen.getByTestId('user-email')).toHaveTextContent(CREDENCIAIS_VALIDAS.email)
    expect(Object.keys(sessionStorage)).toHaveLength(0)
    expect(Object.values(localStorage).join('')).not.toContain(screen.getByTestId('token').textContent)
  })

  it('logout limpa o token da memória', async () => {
    const user = userEvent.setup()
    renderComRouter()

    await user.click(screen.getByRole('button', { name: 'login' }))
    await waitFor(() => expect(screen.getByTestId('token')).not.toHaveTextContent(''))

    await user.click(screen.getByRole('button', { name: 'logout' }))

    expect(screen.getByTestId('token')).toHaveTextContent('')
  })

  it('evento auth:unauthorized dispara logout e navega para /login', async () => {
    const user = userEvent.setup()
    renderComRouter()

    await user.click(screen.getByRole('button', { name: 'login' }))
    await waitFor(() => expect(screen.getByTestId('token')).not.toHaveTextContent(''))

    act(() => {
      window.dispatchEvent(new Event('auth:unauthorized'))
    })

    expect(await screen.findByText('Tela de login')).toBeInTheDocument()
  })

  // T45: o AuthProvider re-renderiza a cada navegação (useNavigate); com o
  // value memoizado, quem só lê o contexto não re-renderiza junto.
  it('não re-renderiza quem lê o contexto quando só a rota muda', async () => {
    definirSessaoEmMemoria({ token: 'token-existente', usuario: USUARIO_EXEMPLO })
    const aoRenderizar = vi.fn()
    function LeitorDoContexto() {
      const { user } = useAuth()
      aoRenderizar()
      return <span>{user?.email}</span>
    }
    function Navegar() {
      const navigate = useNavigate()
      return <button onClick={() => navigate('/outra')}>navegar</button>
    }

    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={['/inicio']}>
          <AuthProvider>
            <LeitorDoContexto />
            <Navegar />
            <Routes>
              <Route path="/inicio" element={<div>Início</div>} />
              <Route path="/outra" element={<div>Outra</div>} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    )
    const rendersAntes = aoRenderizar.mock.calls.length

    await userEvent.setup().click(screen.getByRole('button', { name: 'navegar' }))

    expect(await screen.findByText('Outra')).toBeInTheDocument()
    expect(aoRenderizar).toHaveBeenCalledTimes(rendersAntes)
  })
})
