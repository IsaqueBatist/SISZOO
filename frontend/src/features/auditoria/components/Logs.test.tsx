import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AuthProvider, definirSessaoEmMemoria } from '@/features/auth/hooks/AuthContext'
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
  definirSessaoEmMemoria({ token: 'token-existente', usuario })

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

function capturarEventos() {
  const chamadas: URLSearchParams[] = []
  server.use(
    http.get(`${API_BASE_URL}/auditoria`, ({ request }) => {
      chamadas.push(new URL(request.url).searchParams)
      return HttpResponse.json(
        paginaDe([
          { id: '1', usuarioEmail: 'a@itu.sp.gov.br', acao: 'LOGIN', entidade: 'usuario', entidadeId: null, ocorreuEm: new Date().toISOString() },
          { id: '2', usuarioEmail: 'b@itu.sp.gov.br', acao: 'CRIACAO', entidade: 'vacinacao', entidadeId: null, ocorreuEm: new Date().toISOString() },
        ], 50),
      )
    }),
  )
  return chamadas
}

function paginaDe(itens: Record<string, unknown>[], totalItens = itens.length) {
  return { itens, pagina: 0, tamanho: 20, totalItens, totalPaginas: 1 }
}

describe('Logs', () => {
  it('como Admin, renderiza a lista de eventos agrupada por dia', async () => {
    renderLogs()

    expect(await screen.findByRole('heading', { name: 'Logs do Sistema' })).toBeInTheDocument()
    const linhas = await screen.findAllByText('stephanie.lima@itu.sp.gov.br', { selector: 'strong' })
    expect(linhas.length).toBeGreaterThan(0)
  })

  it('fora do papel Admin, a rota redireciona para o dashboard', async () => {
    renderLogs(['Agente Sanitário'])

    expect(await screen.findByText('Tela de dashboard')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Logs do Sistema' })).not.toBeInTheDocument()
  })

  it('filtrar por ação envia o parâmetro ao servidor e mostra o total da trilha só com filtro ativo', async () => {
    const user = userEvent.setup()
    const chamadas = capturarEventos()
    renderLogs()

    await screen.findByText('a@itu.sp.gov.br', { selector: 'strong' })
    expect(screen.queryByText(/encontrado\(s\) em toda a trilha/)).not.toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Filtrar por ação'), 'Entrada no sistema')

    expect(await screen.findByText('50 evento(s) encontrado(s) em toda a trilha.')).toBeInTheDocument()
    expect(chamadas.at(-1)?.get('acao')).toBe('LOGIN')
  })

  it('não oferece filtro por entidade', async () => {
    capturarEventos()
    renderLogs()

    await screen.findByText('a@itu.sp.gov.br', { selector: 'strong' })
    expect(screen.queryByLabelText('Filtrar por entidade')).not.toBeInTheDocument()
  })

  it('estado vazio quando não há eventos', async () => {
    server.use(http.get(`${API_BASE_URL}/auditoria`, () => HttpResponse.json(paginaDe([]))))
    renderLogs()

    expect(await screen.findByText('Nenhum evento encontrado')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Limpar filtros' })).not.toBeInTheDocument()
  })

  it('sem resultado com filtro, oferece limpar direto do estado vazio', async () => {
    const user = userEvent.setup()
    server.use(http.get(`${API_BASE_URL}/auditoria`, () => HttpResponse.json(paginaDe([]))))
    renderLogs()
    await screen.findByText('Nenhum evento encontrado')

    await user.selectOptions(await screen.findByLabelText('Filtrar por módulo'), 'Relatórios')

    expect(await screen.findByText('Nenhum resultado com estes filtros.')).toBeInTheDocument()
    await user.click(screen.getAllByRole('button', { name: 'Limpar filtros' })[1])
    expect(await screen.findByText('Ainda não há eventos registrados.')).toBeInTheDocument()
  })

  it('volta para a última página quando a atual deixou de existir', async () => {
    sessionStorage.setItem('siszoo_filtros:logs', JSON.stringify({ filtros: {}, pagina: 3 }))
    const paginas: string[] = []
    server.use(
      http.get(`${API_BASE_URL}/auditoria`, ({ request }) => {
        const pagina = new URL(request.url).searchParams.get('pagina') as string
        paginas.push(pagina)
        const itens = pagina === '0' ? [{ id: '1', usuarioEmail: 'a@itu.sp.gov.br', acao: 'LOGIN', entidade: 'usuario', entidadeId: null, ocorreuEm: new Date().toISOString() }] : []
        return HttpResponse.json({ ...paginaDe(itens, 1), totalPaginas: 1 })
      }),
    )
    renderLogs()

    expect(await screen.findByText('a@itu.sp.gov.br', { selector: 'strong' })).toBeInTheDocument()
    expect(paginas).toEqual(['3', '0'])
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

  it('filtrar por módulo envia o parâmetro ao servidor', async () => {
    const user = userEvent.setup()
    const chamadas = capturarEventos()
    renderLogs()

    await screen.findByText('a@itu.sp.gov.br', { selector: 'strong' })

    await user.selectOptions(screen.getByLabelText('Filtrar por módulo'), 'Usuários e Acesso')

    await waitFor(() => expect(chamadas.at(-1)?.get('modulo')).toBe('USUARIOS_ACESSO'))
    expect(await screen.findByText('50 evento(s) encontrado(s) em toda a trilha.')).toBeInTheDocument()
  })
})
