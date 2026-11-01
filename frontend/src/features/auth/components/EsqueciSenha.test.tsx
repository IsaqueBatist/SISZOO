import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { EsqueciSenha } from './EsqueciSenha'
import { AuthProvider } from '../hooks/AuthContext'
import { API_BASE_URL } from '@/lib/env'
import { EMAIL_RECUPERACAO_LIMITADO } from '@/mocks/handlers'
import { server } from '@/mocks/server'

async function renderEsqueciSenha() {
  const queryClient = new QueryClient()
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/esqueci-senha']}>
        <AuthProvider>
          <Routes>
            <Route path="/esqueci-senha" element={<EsqueciSenha />} />
            <Route path="/login" element={<div>Tela de login</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
  await screen.findByRole('button', { name: /enviar link de redefinição/i })
}

describe('EsqueciSenha', () => {
  it('rejeita e-mail fora do domínio institucional sem chamar a API', async () => {
    const user = userEvent.setup()
    let chamadas = 0
    server.use(
      http.post(`${API_BASE_URL}/auth/recuperacao`, () => {
        chamadas += 1
        return new HttpResponse(null, { status: 202 })
      }),
    )
    await renderEsqueciSenha()

    await user.type(screen.getByLabelText(/e-mail institucional/i), 'fulano@gmail.com')
    await user.click(screen.getByRole('button', { name: /enviar link de redefinição/i }))

    expect(await screen.findByText('Use seu e-mail institucional (@itu.sp.gov.br).')).toBeInTheDocument()
    expect(chamadas).toBe(0)
  })

  it('mostra a confirmação sem afirmar que a conta existe', async () => {
    const user = userEvent.setup()
    await renderEsqueciSenha()

    await user.type(screen.getByLabelText(/e-mail institucional/i), 'qualquer.pessoa@itu.sp.gov.br')
    await user.click(screen.getByRole('button', { name: /enviar link de redefinição/i }))

    expect(await screen.findByRole('heading', { name: /verifique seu e-mail/i })).toBeInTheDocument()
    expect(screen.getByText(/estiver cadastrado no SISZOO/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /voltar ao login/i })).toHaveAttribute('href', '/login')
  })

  it('mostra a mensagem de limite quando a API responde 429', async () => {
    const user = userEvent.setup()
    await renderEsqueciSenha()

    await user.type(screen.getByLabelText(/e-mail institucional/i), EMAIL_RECUPERACAO_LIMITADO)
    await user.click(screen.getByRole('button', { name: /enviar link de redefinição/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/muitas tentativas em pouco tempo/i)
    expect(screen.getByRole('button', { name: /enviar link de redefinição/i })).toBeInTheDocument()
  })

  it('avisa sobre falha de rede e mantém o formulário', async () => {
    const user = userEvent.setup()
    server.use(http.post(`${API_BASE_URL}/auth/recuperacao`, () => HttpResponse.error()))
    await renderEsqueciSenha()

    await user.type(screen.getByLabelText(/e-mail institucional/i), 'qualquer.pessoa@itu.sp.gov.br')
    await user.click(screen.getByRole('button', { name: /enviar link de redefinição/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/não foi possível enviar a solicitação/i)
  })
})
