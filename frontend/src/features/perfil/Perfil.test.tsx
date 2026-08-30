import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { API_BASE_URL } from '../../lib/env'
import { server } from '../../mocks/server'
import { Perfil } from './Perfil'

function renderPerfil() {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Perfil />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('Perfil', () => {
  it('exibe os dados do perfil próprio', async () => {
    renderPerfil()

    expect(await screen.findByText('Stéphanie Lima')).toBeInTheDocument()
    expect(screen.getAllByText('stephanie.lima@itu.sp.gov.br').length).toBeGreaterThan(0)
    expect(screen.getByText('VETERINÁRIA')).toBeInTheDocument()
  })

  it('lista as permissões do perfil, incluindo as negadas', async () => {
    renderPerfil()

    await screen.findByText('Stéphanie Lima')

    expect(screen.getByText('Usuários')).toBeInTheDocument()
  })

  it('salva o telefone com sucesso', async () => {
    const user = userEvent.setup()
    renderPerfil()

    await screen.findByText('Stéphanie Lima')
    await user.type(screen.getByLabelText(/telefone/i), '(11) 91234-5678')
    await user.click(screen.getByRole('button', { name: /salvar telefone/i }))

    expect(await screen.findByText(/atualizado com sucesso/i)).toBeInTheDocument()
  })

  it('mantém o telefone digitado quando a requisição falha', async () => {
    server.use(
      http.patch(`${API_BASE_URL}/usuarios/me`, () => {
        return HttpResponse.json({ mensagem: 'Erro' }, { status: 500 })
      }),
    )

    const user = userEvent.setup()
    renderPerfil()

    await screen.findByText('Stéphanie Lima')
    const campoTelefone = screen.getByLabelText(/telefone/i)
    await user.type(campoTelefone, '(11) 91234-5678')
    await user.click(screen.getByRole('button', { name: /salvar telefone/i }))

    expect(await screen.findByText(/não foi possível salvar o telefone/i)).toBeInTheDocument()
    expect(campoTelefone).toHaveValue('(11) 91234-5678')
  })
})
