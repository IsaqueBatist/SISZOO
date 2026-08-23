import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import { Login } from './Login'
import { AuthProvider } from './AuthContext'

function renderLogin() {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('validação do formulário de login', () => {
  it('rejeita e-mail fora do domínio institucional sem disparar requisição', async () => {
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByLabelText(/e-mail institucional/i), 'fulano@gmail.com')
    await user.type(screen.getByLabelText(/^senha/i), 'qualquer-coisa')
    await user.click(screen.getByRole('button', { name: /^entrar$/i }))

    expect(
      await screen.findByText('Use seu e-mail institucional (@itu.sp.gov.br).'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^entrar$/i })).toBeInTheDocument()
  })

  it('bloqueia envio com campos vazios', async () => {
    const user = userEvent.setup()
    renderLogin()

    await user.click(screen.getByRole('button', { name: /^entrar$/i }))

    expect(
      await screen.findByText('Use seu e-mail institucional (@itu.sp.gov.br).'),
    ).toBeInTheDocument()
    expect(screen.getByText('Informe sua senha.')).toBeInTheDocument()
  })
})
