import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'
import { Sidebar } from './Sidebar'
import { AuthProvider, SESSION_STORAGE_KEY } from '../../features/auth/AuthContext'
import type { Usuario } from '../../features/auth/auth.types'

function renderSidebar(cargos: string[]) {
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
          <Sidebar onToggleCollapsed={vi.fn()} />
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
})
