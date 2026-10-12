import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AuthProvider, SESSION_STORAGE_KEY } from '@/features/auth/hooks/AuthContext'
import type { Usuario } from '@/features/auth/types/auth.types'
import { RotaEscritaOcorrencias } from './RotaEscritaOcorrencias'

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

function renderRota(initialEntry = '/ocorrencias/novo') {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <AuthProvider>
          <Routes>
            <Route path="/ocorrencias" element={<div>Lista de ocorrências</div>} />
            <Route element={<RotaEscritaOcorrencias />}>
              <Route path="/ocorrencias/novo" element={<div>Formulário de cadastro</div>} />
              <Route path="/ocorrencias/:id/editar" element={<div>Formulário de edição</div>} />
            </Route>
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('RotaEscritaOcorrencias', () => {
  it('Veterinário é redirecionado para /ocorrencias (só tem leitura no backend)', () => {
    autenticarComCargos(['Veterinário'])

    renderRota()

    expect(screen.getByText('Lista de ocorrências')).toBeInTheDocument()
    expect(screen.queryByText('Formulário de cadastro')).not.toBeInTheDocument()
  })

  it('Veterinário também não acessa a edição', () => {
    autenticarComCargos(['Veterinário'])

    renderRota('/ocorrencias/h5000000-0000-0000-0000-000000000001/editar')

    expect(screen.getByText('Lista de ocorrências')).toBeInTheDocument()
    expect(screen.queryByText('Formulário de edição')).not.toBeInTheDocument()
  })

  it('Administrador acessa a rota normalmente', () => {
    autenticarComCargos(['Administrador'])

    renderRota()

    expect(screen.getByText('Formulário de cadastro')).toBeInTheDocument()
  })

  it('Agente Sanitário acessa a rota normalmente', () => {
    autenticarComCargos(['Agente Sanitário'])

    renderRota()

    expect(screen.getByText('Formulário de cadastro')).toBeInTheDocument()
  })
})
