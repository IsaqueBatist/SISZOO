import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Layout } from './Layout'
import { AuthProvider, SESSION_STORAGE_KEY } from '@/features/auth/hooks/AuthContext'
import type { Usuario } from '@/features/auth/types/auth.types'
import { salvarRascunho, VALIDADE_RASCUNHO_MS, abrirBancoRascunhos } from '@/lib/rascunhoDb'
import { instalarIndexedDbEmMemoria } from '@/test/indexedDbEmMemoria'

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

// T42: o aviso de conexão fica no Layout, visível em qualquer tela
// autenticada, e a varredura de rascunhos vencidos roda uma vez por carga.
describe('Layout — conexão e manutenção dos rascunhos', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('mostra o aviso de conexão quando a rede cai e some quando volta', () => {
    renderLayout()

    act(() => {
      window.dispatchEvent(new Event('offline'))
    })
    expect(screen.getByText('Sem conexão com a internet.')).toBeInTheDocument()

    act(() => {
      window.dispatchEvent(new Event('online'))
    })
    expect(screen.queryByText('Sem conexão com a internet.')).not.toBeInTheDocument()
  })

  it('apaga os rascunhos vencidos ao abrir o sistema', async () => {
    const { conteudo } = instalarIndexedDbEmMemoria()
    const banco = await abrirBancoRascunhos()
    await banco.put(
      'animais',
      { dados: { nome: 'Vencido' }, salvoEm: Date.now() - VALIDADE_RASCUNHO_MS - 1000 } as never,
      'u1:novo',
    )
    banco.close()
    await salvarRascunho('ocorrencias', 'u1:novo', { bairro: 'Recente' })

    renderLayout()

    await waitFor(async () => expect(await conteudo('animais')).toEqual({}))
    expect(await conteudo('ocorrencias')).toHaveProperty('u1:novo')
  })
})
