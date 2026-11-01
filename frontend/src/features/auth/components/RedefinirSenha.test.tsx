import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { RedefinirSenha } from './RedefinirSenha'
import { AuthProvider } from '../hooks/AuthContext'
import { API_BASE_URL } from '@/lib/env'
import { SENHA_ATUAL_RECUPERACAO, TOKEN_RECUPERACAO_VALIDO } from '@/mocks/handlers'
import { server } from '@/mocks/server'

function renderRedefinirSenha(rota: string) {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[rota]}>
        <AuthProvider>
          <Routes>
            <Route path="/redefinir-senha" element={<RedefinirSenha />} />
            <Route path="/esqueci-senha" element={<div>Pedir novo link</div>} />
            <Route path="/login" element={<div>Tela de login</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const ROTA_VALIDA = `/redefinir-senha?token=${TOKEN_RECUPERACAO_VALIDO}`

describe('RedefinirSenha', () => {
  it('sem token na URL, mostra o link inválido e oferece pedir outro', async () => {
    renderRedefinirSenha('/redefinir-senha')

    expect(await screen.findByRole('heading', { name: /link inválido ou expirado/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /solicitar um novo link/i })).toHaveAttribute('href', '/esqueci-senha')
    expect(screen.queryByLabelText(/^nova senha/i)).not.toBeInTheDocument()
  })

  it('token recusado pela API (410) mostra o link inválido sem o formulário', async () => {
    renderRedefinirSenha('/redefinir-senha?token=vencido')

    expect(await screen.findByRole('heading', { name: /link inválido ou expirado/i })).toBeInTheDocument()
    expect(screen.queryByLabelText(/^nova senha/i)).not.toBeInTheDocument()
  })

  it('falha de rede na verificação permite tentar de novo', async () => {
    let tentativas = 0
    server.use(
      http.post(`${API_BASE_URL}/auth/recuperacao/validar`, () => {
        tentativas += 1
        return tentativas === 1 ? HttpResponse.error() : new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    renderRedefinirSenha(ROTA_VALIDA)

    await user.click(await screen.findByRole('button', { name: /tentar novamente/i }))

    expect(await screen.findByLabelText(/^nova senha/i)).toBeInTheDocument()
  })

  it('token válido mostra o formulário e valida a política antes de chamar a API', async () => {
    const user = userEvent.setup()
    renderRedefinirSenha(ROTA_VALIDA)

    await user.type(await screen.findByLabelText(/^nova senha/i), 'somenteminusculas')
    await user.type(screen.getByLabelText(/confirmar nova senha/i), 'outra')
    await user.click(screen.getByRole('button', { name: /salvar nova senha/i }))

    expect(await screen.findByText(/^Use ao menos 3 tipos de caractere/)).toBeInTheDocument()
    expect(screen.getByText('As senhas não coincidem.')).toBeInTheDocument()
  })

  it('erro por campo da API (422) aparece no campo correspondente', async () => {
    const user = userEvent.setup()
    renderRedefinirSenha(ROTA_VALIDA)

    await user.type(await screen.findByLabelText(/^nova senha/i), SENHA_ATUAL_RECUPERACAO)
    await user.type(screen.getByLabelText(/confirmar nova senha/i), SENHA_ATUAL_RECUPERACAO)
    await user.click(screen.getByRole('button', { name: /salvar nova senha/i }))

    expect(await screen.findByText('A nova senha precisa ser diferente da senha atual.')).toBeInTheDocument()
    expect(screen.getByLabelText(/^nova senha/i)).toHaveAttribute('aria-invalid', 'true')
  })

  it('redefine com sucesso e oferece ir para o login', async () => {
    const user = userEvent.setup()
    renderRedefinirSenha(ROTA_VALIDA)

    await user.type(await screen.findByLabelText(/^nova senha/i), 'Nova-Senha-2026')
    await user.type(screen.getByLabelText(/confirmar nova senha/i), 'Nova-Senha-2026')
    await user.click(screen.getByRole('button', { name: /salvar nova senha/i }))

    expect(await screen.findByRole('heading', { name: /senha redefinida/i })).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: /ir para o login/i }))
    expect(await screen.findByText('Tela de login')).toBeInTheDocument()
  })

  it('token consumido entre a verificação e o envio (410) vira link inválido', async () => {
    server.use(
      http.post(`${API_BASE_URL}/auth/recuperacao/redefinir`, () =>
        HttpResponse.json({ mensagem: 'Este link de redefinição de senha é inválido ou já expirou.' }, { status: 410 }),
      ),
    )
    const user = userEvent.setup()
    renderRedefinirSenha(ROTA_VALIDA)

    await user.type(await screen.findByLabelText(/^nova senha/i), 'Nova-Senha-2026')
    await user.type(screen.getByLabelText(/confirmar nova senha/i), 'Nova-Senha-2026')
    await user.click(screen.getByRole('button', { name: /salvar nova senha/i }))

    expect(await screen.findByRole('heading', { name: /link inválido ou expirado/i })).toBeInTheDocument()
  })
})
