import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'
import { Sidebar } from './Sidebar'
import { AuthProvider } from '../../features/auth/AuthContext'

function renderSidebar(roleKey: 'admin' | 'vet' | 'agente') {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AuthProvider>
          <Sidebar roleKey={roleKey} onToggleCollapsed={vi.fn()} />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('Sidebar', () => {
  it('perfil admin vê o item de menu "Usuários"', () => {
    renderSidebar('admin')

    expect(screen.getByRole('link', { name: /usuários/i })).toBeInTheDocument()
  })

  it('perfil agente não vê o item de menu "Usuários"', () => {
    renderSidebar('agente')

    expect(screen.queryByRole('link', { name: /usuários/i })).not.toBeInTheDocument()
  })
})
