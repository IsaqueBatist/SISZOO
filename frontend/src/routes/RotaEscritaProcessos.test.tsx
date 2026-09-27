import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AuthProvider, SESSION_STORAGE_KEY } from '../features/auth/AuthContext'
import type { Usuario } from '../features/auth/auth.types'
import { RotaEscritaProcessos } from './RotaEscritaProcessos'

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

function renderRota(initialEntry = '/processos/novo') {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <AuthProvider>
          <Routes>
            <Route path="/processos" element={<div>Lista de processos</div>} />
            <Route element={<RotaEscritaProcessos />}>
              <Route path="/processos/novo" element={<div>Formulário de cadastro</div>} />
            </Route>
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

// PROCESSOS_SANITARIOS:escrita (V3__seed_cargos.sql) é concedida aos 3
// perfis reais do sistema — diferente de RotaEscritaAnimais/RotaEscritaOcorrencias,
// não há hoje nenhum perfil real sem escrita para exercitar um caso negativo
// através do fluxo público de autenticação (roleKeyFromCargos sempre resolve
// para admin/vet/agente). O teste cobre os 3 perfis reais; a guarda em si
// nega por padrão (fail-closed) qualquer roleKey fora desse conjunto.
describe('RotaEscritaProcessos', () => {
  it('Administrador acessa a rota normalmente', () => {
    autenticarComCargos(['Administrador'])
    renderRota()
    expect(screen.getByText('Formulário de cadastro')).toBeInTheDocument()
  })

  it('Veterinário acessa a rota normalmente', () => {
    autenticarComCargos(['Veterinário'])
    renderRota()
    expect(screen.getByText('Formulário de cadastro')).toBeInTheDocument()
  })

  it('Agente Sanitário acessa a rota normalmente', () => {
    autenticarComCargos(['Agente Sanitário'])
    renderRota()
    expect(screen.getByText('Formulário de cadastro')).toBeInTheDocument()
  })
})
