import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'
import { Sidebar } from './Sidebar'
import { AuthProvider, SESSION_STORAGE_KEY } from '@/features/auth/hooks/AuthContext'
import type { Usuario } from '@/features/auth/types/auth.types'

function renderSidebar(cargos: string[], collapsed = false, onToggleCollapsed = vi.fn()) {
  const usuario: Usuario = {
    id: 'a1b2c3d4-0000-0000-0000-000000000001',
    nome: 'Stéphanie',
    sobrenome: 'Lima',
    email: 'stephanie.lima@itu.sp.gov.br',
    cargos,
    senhaAlteradaEm: '2026-01-10T12:00:00Z',
  }
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ token: 'token-existente', usuario }))

  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AuthProvider>
          <Sidebar collapsed={collapsed} onToggleCollapsed={onToggleCollapsed} />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('Sidebar', () => {
  it('perfil admin vê o item de menu "Usuários"', () => {
    renderSidebar(['Administrador'])

    expect(screen.getByRole('link', { name: /usuários/i })).toBeInTheDocument()
  })

  it('perfil agente não vê o item de menu "Usuários"', () => {
    renderSidebar(['Agente Sanitário'])

    expect(screen.queryByRole('link', { name: /usuários/i })).not.toBeInTheDocument()
  })

  it('colapsada, os itens de menu continuam com nome acessível (texto visualmente escondido, não removido)', () => {
    renderSidebar(['Administrador'], true)

    // getByRole por nome só encontra se o texto ainda existir no DOM (ainda
    // que visualmente escondido) — display:none falharia esse teste.
    expect(screen.getByRole('link', { name: /animais/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /usuários/i })).toBeInTheDocument()
  })

  it('título/aria-expanded do botão de alternar refletem o estado atual', () => {
    const { rerender } = renderSidebar(['Administrador'], false)
    const botao = screen.getByRole('button', { name: /recolher menu/i })
    expect(botao).toHaveAttribute('aria-expanded', 'true')
    expect(botao).toHaveAttribute('title', 'Recolher')

    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <AuthProvider>
            <Sidebar collapsed onToggleCollapsed={vi.fn()} />
          </AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    )
    const botaoColapsado = screen.getByRole('button', { name: /expandir menu/i })
    expect(botaoColapsado).toHaveAttribute('aria-expanded', 'false')
    expect(botaoColapsado).toHaveAttribute('title', 'Expandir')
  })

  it('clique no botão de alternar chama onToggleCollapsed', async () => {
    const onToggleCollapsed = vi.fn()
    const user = userEvent.setup()
    renderSidebar(['Administrador'], false, onToggleCollapsed)

    await user.click(screen.getByRole('button', { name: /recolher menu/i }))

    expect(onToggleCollapsed).toHaveBeenCalledTimes(1)
  })
})
