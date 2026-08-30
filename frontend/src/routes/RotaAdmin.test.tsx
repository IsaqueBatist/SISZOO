import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import { RotaAdmin } from './RotaAdmin'
import { AuthProvider, SESSION_STORAGE_KEY } from '../features/auth/AuthContext'
import type { Usuario } from '../features/auth/auth.types'

function autenticarComCargos(cargos: string[]) {
  const usuario: Usuario = {
    id: 'a1b2c3d4-0000-0000-0000-000000000099',
    nome: 'Ana',
    sobrenome: 'Silva',
    email: 'ana.silva@itu.sp.gov.br',
    cargos,
    senhaAlteradaEm: '2026-01-10T12:00:00Z',
  }
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ token: 'token-existente', usuario }))
}

function renderRotaAdmin(initialEntry = '/usuarios') {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <AuthProvider>
          <Routes>
            <Route path="/dashboard" element={<div>Dashboard</div>} />
            <Route element={<RotaAdmin />}>
              <Route path="/usuarios" element={<div>Página de usuários</div>} />
            </Route>
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('RotaAdmin', () => {
  it('perfil não-admin é redirecionado para /dashboard', () => {
    autenticarComCargos(['Agente Sanitário'])

    renderRotaAdmin()

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.queryByText('Página de usuários')).not.toBeInTheDocument()
  })

  it('perfil Administrador acessa a rota normalmente', () => {
    autenticarComCargos(['Administrador'])

    renderRotaAdmin()

    expect(screen.getByText('Página de usuários')).toBeInTheDocument()
  })
})
