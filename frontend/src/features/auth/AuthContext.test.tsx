import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import { AuthProvider, SESSION_STORAGE_KEY, useAuth } from './AuthContext'
import { CREDENCIAIS_VALIDAS } from '../../mocks/handlers'
import type { Usuario } from './auth.types'

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
  it('rehidrata a sessão a partir do sessionStorage no boot', () => {
    sessionStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ token: 'token-existente', usuario: USUARIO_EXEMPLO }),
    )

    renderComRouter()

    expect(screen.getByTestId('token')).toHaveTextContent('token-existente')
    expect(screen.getByTestId('user-email')).toHaveTextContent(USUARIO_EXEMPLO.email)
  })

  it('login bem-sucedido grava token e usuário em memória e sessionStorage', async () => {
    const user = userEvent.setup()
    renderComRouter()

    await user.click(screen.getByRole('button', { name: 'login' }))

    await waitFor(() => expect(screen.getByTestId('token')).not.toHaveTextContent(''))

    const armazenado = JSON.parse(sessionStorage.getItem(SESSION_STORAGE_KEY)!)
    expect(armazenado.token).toBeTruthy()
    expect(armazenado.usuario.email).toBe(CREDENCIAIS_VALIDAS.email)
  })

  it('logout limpa o token da memória e do sessionStorage', async () => {
    const user = userEvent.setup()
    renderComRouter()

    await user.click(screen.getByRole('button', { name: 'login' }))
    await waitFor(() => expect(screen.getByTestId('token')).not.toHaveTextContent(''))

    await user.click(screen.getByRole('button', { name: 'logout' }))

    expect(screen.getByTestId('token')).toHaveTextContent('')
    expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull()
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
    expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull()
  })
})
