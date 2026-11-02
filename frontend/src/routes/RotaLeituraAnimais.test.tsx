import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AuthProvider, definirSessaoEmMemoria } from '@/features/auth/hooks/AuthContext'
import type { Usuario } from '@/features/auth/types/auth.types'
import { RotaLeituraAnimais } from './RotaLeituraAnimais'

function autenticarComCargos(cargos: string[]) {
  const usuario: Usuario = {
    id: 'a1b2c3d4-0000-0000-0000-000000000099',
    nome: 'Ana',
    sobrenome: 'Silva',
    email: 'ana.silva@itu.sp.gov.br',
    cargos,
    senhaAlteradaEm: '2026-01-10T12:00:00Z',
  }
  definirSessaoEmMemoria({ token: 'token-existente', usuario })
}

function renderRota(initialEntry = '/animais') {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <AuthProvider>
          <Routes>
            <Route path="/dashboard" element={<div>Dashboard</div>} />
            <Route element={<RotaLeituraAnimais />}>
              <Route path="/animais" element={<div>Lista de animais</div>} />
              <Route path="/animais/:id" element={<div>Ficha do animal</div>} />
              <Route path="/alertas/vacinas" element={<div>Alertas de vacina</div>} />
            </Route>
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('RotaLeituraAnimais', () => {
  it('Administrador acessa a lista de animais', () => {
    autenticarComCargos(['Administrador'])

    renderRota()

    expect(screen.getByText('Lista de animais')).toBeInTheDocument()
  })

  it('Veterinário acessa a lista de animais', () => {
    autenticarComCargos(['Veterinário'])

    renderRota()

    expect(screen.getByText('Lista de animais')).toBeInTheDocument()
  })

  it('Agente Sanitário é redirecionado para /dashboard na lista de animais', () => {
    autenticarComCargos(['Agente Sanitário'])

    renderRota()

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.queryByText('Lista de animais')).not.toBeInTheDocument()
  })

  it('Agente Sanitário é redirecionado na ficha individual do animal', () => {
    autenticarComCargos(['Agente Sanitário'])

    renderRota('/animais/a1b2c3d4-0000-0000-0000-000000000001')

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.queryByText('Ficha do animal')).not.toBeInTheDocument()
  })

  it('Agente Sanitário é redirecionado nos alertas de reforço vacinal', () => {
    autenticarComCargos(['Agente Sanitário'])

    renderRota('/alertas/vacinas')

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.queryByText('Alertas de vacina')).not.toBeInTheDocument()
  })

  it('perfil não reconhecido é redirecionado para /dashboard', () => {
    autenticarComCargos(['Cargo Inexistente'])

    renderRota()

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.queryByText('Lista de animais')).not.toBeInTheDocument()
  })
})
