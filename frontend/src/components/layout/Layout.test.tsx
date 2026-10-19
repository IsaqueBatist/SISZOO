import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, describe, expect, it } from 'vitest'
import { Layout } from './Layout'
import { AuthProvider, SESSION_STORAGE_KEY } from '@/features/auth/hooks/AuthContext'
import type { Usuario } from '@/features/auth/types/auth.types'

const CHAVE_SIDEBAR_COLAPSADA = 'siszoo:sidebar-collapsed'

function renderLayout() {
  const usuario: Usuario = {
    id: 'a1b2c3d4-0000-0000-0000-000000000001',
    nome: 'Stéphanie',
    sobrenome: 'Lima',
    email: 'stephanie.lima@itu.sp.gov.br',
    cargos: ['Administrador'],
    senhaAlteradaEm: '2026-01-10T12:00:00Z',
  }
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ token: 'token-existente', usuario }))

  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/dashboard']}>
        <AuthProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<p>Conteúdo</p>} />
            </Route>
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

afterEach(() => {
  localStorage.clear()
})

describe('Layout', () => {
  it('estado colapsado da sidebar persiste em localStorage entre remounts', async () => {
    const user = userEvent.setup()
    const { unmount } = renderLayout()

    await user.click(screen.getByRole('button', { name: /recolher menu/i }))
    expect(localStorage.getItem(CHAVE_SIDEBAR_COLAPSADA)).toBe('true')

    unmount()
    renderLayout()

    expect(screen.getByRole('button', { name: /expandir menu/i })).toBeInTheDocument()
  })

  it('sem localStorage disponível, inicia expandida sem quebrar a tela', () => {
    const original = window.localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: () => {
          throw new Error('indisponível')
        },
        setItem: () => {
          throw new Error('indisponível')
        },
      },
      configurable: true,
    })

    renderLayout()
    expect(screen.getByRole('button', { name: /recolher menu/i })).toBeInTheDocument()

    Object.defineProperty(window, 'localStorage', { value: original, configurable: true })
  })
})
