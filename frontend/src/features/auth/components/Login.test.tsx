import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, describe, expect, it } from 'vitest'
import { Login } from './Login'
import { AuthProvider, definirSessaoEmMemoria } from '../hooks/AuthContext'
import { CREDENCIAIS_VALIDAS } from '@/mocks/handlers'

// O formulário aparece depois de a aba descobrir que não há sessão.
async function renderLogin() {
  const queryClient = new QueryClient()
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
  await screen.findByRole('button', { name: /^entrar$/i })
}

describe('validação do formulário de login', () => {
  it('oferece o caminho de recuperação de senha', async () => {
    await renderLogin()

    expect(screen.getByRole('link', { name: /esqueci minha senha/i })).toHaveAttribute('href', '/esqueci-senha')
  })

  it('rejeita e-mail fora do domínio institucional sem disparar requisição', async () => {
    const user = userEvent.setup()
    await renderLogin()

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
    await renderLogin()

    await user.click(screen.getByRole('button', { name: /^entrar$/i }))

    expect(
      await screen.findByText('Use seu e-mail institucional (@itu.sp.gov.br).'),
    ).toBeInTheDocument()
    expect(screen.getByText('Informe sua senha.')).toBeInTheDocument()
  })

  it('rejeita e-mail institucional com dígito', async () => {
    const user = userEvent.setup()
    await renderLogin()

    await user.type(screen.getByLabelText(/e-mail institucional/i), 'fulano1@itu.sp.gov.br')
    await user.type(screen.getByLabelText(/^senha/i), 'qualquer-coisa')
    await user.click(screen.getByRole('button', { name: /^entrar$/i }))

    expect(
      await screen.findByText('Use seu e-mail institucional (@itu.sp.gov.br).'),
    ).toBeInTheDocument()
  })

  it('aceita e-mail institucional no formato nome.sobrenome', async () => {
    const user = userEvent.setup()
    await renderLogin()

    await user.type(screen.getByLabelText(/e-mail institucional/i), CREDENCIAIS_VALIDAS.email)
    await user.type(screen.getByLabelText(/^senha/i), CREDENCIAIS_VALIDAS.senha)
    await user.click(screen.getByRole('button', { name: /^entrar$/i }))

    // Login aceito: com sessão aberta, a tela de login dá lugar ao destino.
    await waitFor(() => expect(screen.queryByRole('button', { name: /^entrar$/i })).not.toBeInTheDocument())
    expect(
      screen.queryByText('Use seu e-mail institucional (@itu.sp.gov.br).'),
    ).not.toBeInTheDocument()
  })
})

describe('sessão', () => {
  function renderComEstado(estado: unknown) {
    const queryClient = new QueryClient()
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[{ pathname: '/login', state: estado }]}>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<p>Dashboard</p>} />
              <Route path="/ocorrencias" element={<p>Ocorrências</p>} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    )
  }

  afterEach(() => sessionStorage.clear())

  it('explica que a sessão expirou', async () => {
    definirSessaoEmMemoria({
      token: 'token-vencido',
      usuario: { id: 'u1', nome: 'Ana', sobrenome: 'Silva', email: 'ana@itu.sp.gov.br', cargos: ['Agente Sanitário'], senhaAlteradaEm: '2026-01-10T12:00:00Z' },
    })
    renderComEstado(null)
    window.dispatchEvent(new Event('auth:unauthorized'))

    expect(await screen.findByText('Sua sessão expirou. Entre de novo para continuar de onde parou.')).toBeInTheDocument()
  })

  it('depois de entrar, volta para onde a pessoa estava', async () => {
    const user = userEvent.setup()
    renderComEstado({ voltarPara: '/ocorrencias' })

    await user.type(await screen.findByLabelText(/e-mail institucional/i), CREDENCIAIS_VALIDAS.email)
    await user.type(screen.getByLabelText(/^senha/i), CREDENCIAIS_VALIDAS.senha)
    await user.click(screen.getByRole('button', { name: /^entrar$/i }))

    expect(await screen.findByText('Ocorrências')).toBeInTheDocument()
  })

  it('com sessão aberta, não mostra o formulário de login', async () => {
    definirSessaoEmMemoria({
        token: 'token-existente',
        usuario: { id: 'u1', nome: 'Ana', sobrenome: 'Silva', email: 'ana@itu.sp.gov.br', cargos: ['Agente Sanitário'], senhaAlteradaEm: '2026-01-10T12:00:00Z' },
      })
    renderComEstado(null)

    expect(await screen.findByText('Dashboard')).toBeInTheDocument()
  })
})
