import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AuthProvider, SESSION_STORAGE_KEY } from '../features/auth/AuthContext'
import type { Usuario } from '../features/auth/auth.types'
import { RotaGestaoBaias } from './RotaGestaoBaias'

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

function renderRota(initialEntry = '/baias') {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <AuthProvider>
          <Routes>
            <Route path="/dashboard" element={<div>Dashboard</div>} />
            <Route element={<RotaGestaoBaias />}>
              <Route path="/baias" element={<div>Gestão de Baias</div>} />
            </Route>
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('RotaGestaoBaias', () => {
  it('Agente Sanitário é redirecionado para /dashboard (não vê a tela, mesmo por URL direta)', () => {
    autenticarComCargos(['Agente Sanitário'])

    renderRota()

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.queryByText('Gestão de Baias')).not.toBeInTheDocument()
  })

  it('Administrador acessa a rota normalmente', () => {
    autenticarComCargos(['Administrador'])

    renderRota()

    expect(screen.getByText('Gestão de Baias')).toBeInTheDocument()
  })

  it('Veterinário acessa a rota normalmente', () => {
    autenticarComCargos(['Veterinário'])

    renderRota()

    expect(screen.getByText('Gestão de Baias')).toBeInTheDocument()
  })
})
