import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import { AppRoutes } from './AppRoutes'

function renderApp() {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/login']}>
        <AppRoutes />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('roteamento entre login e dashboard', () => {
  it('mostra a tela de login por padrão e navega para o dashboard ao entrar', async () => {
    const user = userEvent.setup()
    renderApp()

    expect(screen.getByLabelText(/e-mail institucional/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /^entrar$/i }))

    expect(
      await screen.findByRole('heading', { name: /dashboard operacional/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /siszoo/i })).toBeInTheDocument()
  })
})
