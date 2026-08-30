import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import { RotaProtegida } from './RotaProtegida'
import { AuthProvider, SESSION_STORAGE_KEY } from '../features/auth/AuthContext'
import type { Usuario } from '../features/auth/auth.types'

const USUARIO_EXEMPLO: Usuario = {
  id: 'a1b2c3d4-0000-0000-0000-000000000099',
  nome: 'Ana',
  sobrenome: 'Silva',
  email: 'ana.silva@itu.sp.gov.br',
  cargos: ['Administrador'],
  senhaAlteradaEm: '2026-01-10T12:00:00Z',
}

function renderRotaProtegida(initialEntry: string) {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<div>Tela de login</div>} />
            <Route element={<RotaProtegida />}>
              <Route path="/protegida" element={<div>Conteúdo protegido</div>} />
              <Route path="/trocar-senha" element={<div>Trocar senha</div>} />
            </Route>
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function autenticar(usuario: Usuario) {
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ token: 'token-existente', usuario }))
}

describe('RotaProtegida', () => {
  it('sem token redireciona para /login', () => {
    renderRotaProtegida('/protegida')

    expect(screen.getByText('Tela de login')).toBeInTheDocument()
    expect(screen.queryByText('Conteúdo protegido')).not.toBeInTheDocument()
  })

  it('com token e senha já alterada renderiza o conteúdo protegido', () => {
    autenticar(USUARIO_EXEMPLO)

    renderRotaProtegida('/protegida')

    expect(screen.getByText('Conteúdo protegido')).toBeInTheDocument()
  })

  it('com senhaAlteradaEm nula redireciona para /trocar-senha (1º acesso)', () => {
    autenticar({ ...USUARIO_EXEMPLO, senhaAlteradaEm: null })

    renderRotaProtegida('/protegida')

    expect(screen.getByText('Trocar senha')).toBeInTheDocument()
    expect(screen.queryByText('Conteúdo protegido')).not.toBeInTheDocument()
  })

  it('com senhaAlteradaEm nula ao reabrir a aba (sessão reidratada) continua preso em /trocar-senha', () => {
    autenticar({ ...USUARIO_EXEMPLO, senhaAlteradaEm: null })

    renderRotaProtegida('/trocar-senha')

    expect(screen.getByText('Trocar senha')).toBeInTheDocument()
  })
})
