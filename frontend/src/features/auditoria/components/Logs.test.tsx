import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AuthProvider, SESSION_STORAGE_KEY } from '@/features/auth/hooks/AuthContext'
import type { Usuario } from '@/features/auth/types/auth.types'
import { API_BASE_URL } from '@/lib/env'
import { server } from '@/mocks/server'
import { RotaAdmin } from '@/routes/RotaAdmin'
import { Logs } from './Logs'

function renderLogs(cargos: string[] = ['Administrador']) {
  const usuario: Usuario = {
    id: 'a1b2c3d4-0000-0000-0000-000000000099',
    nome: 'Ana',
    sobrenome: 'Silva',
    email: 'ana.silva@itu.sp.gov.br',
    cargos,
    senhaAlteradaEm: '2026-01-10T12:00:00Z',
  }
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ token: 'token-existente', usuario }))

  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/logs']}>
        <AuthProvider>
          <Routes>
            <Route element={<RotaAdmin />}>
              <Route path="/logs" element={<Logs />} />
            </Route>
            <Route path="/dashboard" element={<p>Tela de dashboard</p>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function paginaDe(itens: Record<string, unknown>[], totalItens = itens.length) {
  return { itens, pagina: 0, tamanho: 20, totalItens, totalPaginas: 1 }
}

describe('Logs', () => {
  it('como Admin, renderiza a lista de eventos agrupada por dia', async () => {
    renderLogs()

    expect(await screen.findByRole('heading', { name: 'Logs do Sistema' })).toBeInTheDocument()
    // A fixture tem 2 eventos de stephanie.lima — confere ao menos uma linha
    // de evento (<strong>), não a opção do filtro por usuário.
    const linhas = await screen.findAllByText('stephanie.lima@itu.sp.gov.br', { selector: 'strong' })
    expect(linhas.length).toBeGreaterThan(0)
  })

  it('fora do papel Admin, a rota redireciona para o dashboard', async () => {
    renderLogs(['Agente Sanitário'])

    expect(await screen.findByText('Tela de dashboard')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Logs do Sistema' })).not.toBeInTheDocument()
  })

  it('filtrar por ação mostra o aviso "Filtro aplicado..." e não mostra sem filtro', async () => {
    const user = userEvent.setup()
    server.use(
      http.get(`${API_BASE_URL}/auditoria`, () =>
        HttpResponse.json(
          paginaDe([
            { id: '1', usuarioEmail: 'a@itu.sp.gov.br', acao: 'LOGIN', entidade: 'usuario', entidadeId: null, ocorreuEm: new Date().toISOString() },
            { id: '2', usuarioEmail: 'b@itu.sp.gov.br', acao: 'CRIACAO', entidade: 'vacinacao', entidadeId: null, ocorreuEm: new Date().toISOString() },
          ], 50),
        ),
      ),
    )
    renderLogs()

    await screen.findByText('a@itu.sp.gov.br', { selector: 'strong' })
    expect(screen.queryByText(/Filtro aplicado/)).not.toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Filtrar por ação'), 'LOGIN')

    expect(await screen.findByText('Filtro aplicado aos 1 eventos desta página (de 50 no total).')).toBeInTheDocument()
    expect(screen.queryByText('b@itu.sp.gov.br', { selector: 'strong' })).not.toBeInTheDocument()
  })

  it('estado vazio quando não há eventos', async () => {
    server.use(http.get(`${API_BASE_URL}/auditoria`, () => HttpResponse.json(paginaDe([]))))
    renderLogs()

    expect(await screen.findByText('Nenhum evento encontrado')).toBeInTheDocument()
  })

  it('erro ao carregar mostra retry', async () => {
    server.use(http.get(`${API_BASE_URL}/auditoria`, () => HttpResponse.json({ mensagem: 'Erro' }, { status: 500 })))
    renderLogs()

    expect(await screen.findByRole('button', { name: 'Tentar novamente' })).toBeInTheDocument()
  })

  it('agrupa os eventos do dia em sub-seções por módulo', async () => {
    server.use(
      http.get(`${API_BASE_URL}/auditoria`, () =>
        HttpResponse.json(
          paginaDe([
            { id: '1', usuarioEmail: 'a@itu.sp.gov.br', acao: 'LOGIN', entidade: 'usuario', entidadeId: null, ocorreuEm: new Date().toISOString() },
            { id: '2', usuarioEmail: 'b@itu.sp.gov.br', acao: 'CRIACAO', entidade: 'vacinacao', entidadeId: null, ocorreuEm: new Date().toISOString() },
          ]),
        ),
      ),
    )
    renderLogs()

    expect(await screen.findByRole('heading', { name: 'Usuários e Acesso' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Gestão de Animais' })).toBeInTheDocument()
  })

  it('filtrar por módulo mostra só os eventos daquele módulo', async () => {
    const user = userEvent.setup()
    server.use(
      http.get(`${API_BASE_URL}/auditoria`, () =>
        HttpResponse.json(
          paginaDe([
            { id: '1', usuarioEmail: 'a@itu.sp.gov.br', acao: 'LOGIN', entidade: 'usuario', entidadeId: null, ocorreuEm: new Date().toISOString() },
            { id: '2', usuarioEmail: 'b@itu.sp.gov.br', acao: 'CRIACAO', entidade: 'vacinacao', entidadeId: null, ocorreuEm: new Date().toISOString() },
          ], 50),
        ),
      ),
    )
    renderLogs()

    await screen.findByText('a@itu.sp.gov.br', { selector: 'strong' })

    await user.selectOptions(screen.getByLabelText('Filtrar por módulo'), 'Usuários e Acesso')

    expect(await screen.findByText('Filtro aplicado aos 1 eventos desta página (de 50 no total).')).toBeInTheDocument()
    expect(screen.queryByText('b@itu.sp.gov.br', { selector: 'strong' })).not.toBeInTheDocument()
  })
})
