import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'
import { AppRoutes } from '../../routes/AppRoutes'
import { AuthProvider, SESSION_STORAGE_KEY } from '../auth/AuthContext'
import type { Usuario } from '../auth/auth.types'

const ADMIN: Usuario = {
  id: 'a1b2c3d4-0000-0000-0000-000000000097',
  nome: 'Paulo',
  sobrenome: 'Henriques',
  email: 'paulo.henriques@itu.sp.gov.br',
  cargos: ['Administrador'],
  senhaAlteradaEm: '2024-03-15T09:00:00Z',
}

const NOVA_SENHA_INICIAL = 'senha-provisoria-123'

function renderApp() {
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ token: 'token-admin', usuario: ADMIN }))

  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/usuarios']}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('fluxo completo: admin cria usuário → 1º login força troca de senha', () => {
  it('usuário recém-criado é obrigado a trocar a senha antes de acessar o dashboard', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const user = userEvent.setup()
    renderApp()

    await screen.findByRole('heading', { name: /usuários do sistema/i })
    await user.click(screen.getByRole('button', { name: /adicionar usuário/i }))

    await user.type(screen.getByLabelText(/nome completo/i), 'Fernanda Rocha')
    await user.type(screen.getByLabelText(/e-mail institucional/i), 'fernanda.rocha@itu.sp.gov.br')
    await user.selectOptions(screen.getByLabelText(/^perfil/i), 'Agente Sanitário')

    const senhaInicialInput = screen.getByLabelText(/senha inicial/i)
    await user.clear(senhaInicialInput)
    await user.type(senhaInicialInput, NOVA_SENHA_INICIAL)

    await user.click(screen.getByRole('button', { name: /^criar usuário$/i }))
    await screen.findByText('Fernanda Rocha')

    await user.click(screen.getByRole('button', { name: 'Sair' }))
    await screen.findByLabelText(/e-mail institucional/i)

    await user.type(screen.getByLabelText(/e-mail institucional/i), 'fernanda.rocha@itu.sp.gov.br')
    await user.type(screen.getByLabelText(/^senha/i), NOVA_SENHA_INICIAL)
    await user.click(screen.getByRole('button', { name: /^entrar$/i }))

    expect(await screen.findByRole('heading', { name: /troque sua senha/i })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /dashboard operacional/i })).not.toBeInTheDocument()

    await user.type(screen.getByLabelText(/^nova senha/i), 'senha-definitiva-456')
    await user.type(screen.getByLabelText(/confirmar nova senha/i), 'senha-definitiva-456')
    await user.click(screen.getByRole('button', { name: /salvar nova senha/i }))

    expect(await screen.findByRole('heading', { name: /dashboard operacional/i })).toBeInTheDocument()

    vi.restoreAllMocks()
    // Timeout maior: fluxo ponta a ponta com várias idas à API mockada, mais lento que um teste unitário.
  }, 15000)
})
