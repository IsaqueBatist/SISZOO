import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AuthProvider, SESSION_STORAGE_KEY } from '@/features/auth/hooks/AuthContext'
import type { Usuario } from '@/features/auth/types/auth.types'
import { getNavForRole, isNavGroup } from '@/lib/nav'
import { RotaLeituraOcorrencias } from './RotaLeituraOcorrencias'

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

function renderRota(initialEntry = '/ocorrencias') {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <AuthProvider>
          <Routes>
            <Route path="/dashboard" element={<div>Dashboard</div>} />
            <Route element={<RotaLeituraOcorrencias />}>
              <Route path="/ocorrencias" element={<div>Lista de ocorrências</div>} />
              <Route path="/ocorrencias/:id" element={<div>Detalhe da ocorrência</div>} />
            </Route>
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function idsDoMenu(roleKey: 'admin' | 'vet' | 'agente') {
  return getNavForRole(roleKey).flatMap((entry) => (isNavGroup(entry) ? [] : [entry.id]))
}

describe('RotaLeituraOcorrencias', () => {
  it('Veterinário é redirecionado para /dashboard ao abrir a lista por URL direta', () => {
    autenticarComCargos(['Veterinário'])

    renderRota()

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.queryByText('Lista de ocorrências')).not.toBeInTheDocument()
  })

  it('Veterinário também não abre o detalhe', () => {
    autenticarComCargos(['Veterinário'])

    renderRota('/ocorrencias/h5000000-0000-0000-0000-000000000001')

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.queryByText('Detalhe da ocorrência')).not.toBeInTheDocument()
  })

  it('Administrador acessa a rota normalmente', () => {
    autenticarComCargos(['Administrador'])

    renderRota()

    expect(screen.getByText('Lista de ocorrências')).toBeInTheDocument()
  })

  it('Agente Sanitário acessa a rota normalmente', () => {
    autenticarComCargos(['Agente Sanitário'])

    renderRota()

    expect(screen.getByText('Lista de ocorrências')).toBeInTheDocument()
  })
})

describe('menu de ocorrências por perfil', () => {
  it('o Veterinário não vê o item Ocorrências; Administrador e Agente veem', () => {
    expect(idsDoMenu('vet')).not.toContain('ocorrencias')
    expect(idsDoMenu('admin')).toContain('ocorrencias')
    expect(idsDoMenu('agente')).toContain('ocorrencias')
  })
})
