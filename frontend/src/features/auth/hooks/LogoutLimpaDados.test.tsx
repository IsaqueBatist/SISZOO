import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CadastrarOcorrencia } from '@/features/ocorrencias/components/CadastrarOcorrencia'
import { salvarAnexosPendentes } from '@/features/ocorrencias/storage/rascunhoOcorrenciaStorage'
import { API_BASE_URL } from '@/lib/env'
import { ANEXO_CRIADO_FIXTURE, OCORRENCIA_ABERTA_ID } from '@/mocks/ocorrenciasFixtures'
import { server } from '@/mocks/server'
import { instalarIndexedDbEmMemoria } from '@/test/indexedDbEmMemoria'
import type { LoginRequest, Usuario } from '../types/auth.types'
import { AuthProvider } from './AuthContext'
import { useAuth } from './useAuth'

const USUARIO_A: Usuario = {
  id: 'a1b2c3d4-0000-0000-0000-00000000000a',
  nome: 'Ana',
  sobrenome: 'Agente',
  email: 'ana@itu.sp.gov.br',
  cargos: ['Agente Sanitário'],
  senhaAlteradaEm: '2026-01-10T12:00:00Z',
}
const USUARIO_B: Usuario = { ...USUARIO_A, id: 'a1b2c3d4-0000-0000-0000-00000000000b', nome: 'Bruno', email: 'bruno@itu.sp.gov.br' }

function EntrarComo() {
  const { login } = useAuth()
  const navigate = useNavigate()
  async function entrar(usuario: Usuario) {
    await login({ email: usuario.email, senha: 'senha' })
    navigate('/ocorrencias/novo')
  }
  return (
    <div>
      <button onClick={() => void entrar(USUARIO_A)}>Entrar como A</button>
      <button onClick={() => void entrar(USUARIO_B)}>Entrar como B</button>
    </div>
  )
}

// Mesmo fluxo do botão "Sair" da Sidebar.
function BotaoSair() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  return (
    <button
      onClick={() => {
        logout()
        navigate('/login')
      }}
    >
      Sair
    </button>
  )
}

function renderApp(queryClient: QueryClient) {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<EntrarComo />} />
            <Route
              path="/ocorrencias/novo"
              element={
                <>
                  <BotaoSair />
                  <CadastrarOcorrencia />
                </>
              }
            />
            <Route path="/ocorrencias/:id" element={<div>Detalhe da ocorrência</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

async function digitarRascunhoEEsperarGravacao(
  user: ReturnType<typeof userEvent.setup>,
  conteudo: (store: string) => Promise<Record<string, unknown>>,
) {
  await user.type(await screen.findByLabelText(/^Bairro/i), 'Bairro do A')
  await waitFor(async () => expect(await conteudo('ocorrencias')).toHaveProperty(`${USUARIO_A.id}:novo`))
}

describe('logout limpa cache e IndexedDB', () => {
  let conteudo: (store: string) => Promise<Record<string, unknown>>

  beforeEach(() => {
    conteudo = instalarIndexedDbEmMemoria().conteudo
    server.use(
      http.post(`${API_BASE_URL}/auth/login`, async ({ request }) => {
        const { email } = (await request.json()) as LoginRequest
        const usuario = email === USUARIO_A.email ? USUARIO_A : USUARIO_B
        return HttpResponse.json({ token: `token-${usuario.id}`, usuario })
      }),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('login A → rascunho → logout → login B: B não vê o rascunho nem o cache de A', async () => {
    const user = userEvent.setup()
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    renderApp(queryClient)

    await user.click(screen.getByRole('button', { name: 'Entrar como A' }))
    await digitarRascunhoEEsperarGravacao(user, conteudo)
    queryClient.setQueryData(['dados-de-a'], 'só do A')

    await user.click(screen.getByRole('button', { name: 'Sair' }))

    await waitFor(async () => expect(await conteudo('ocorrencias')).toEqual({}))
    await waitFor(() => expect(queryClient.getQueryData(['dados-de-a'])).toBeUndefined())

    await user.click(screen.getByRole('button', { name: 'Entrar como B' }))
    expect(await screen.findByRole('button', { name: 'Registrar Ocorrência' })).toBeEnabled()
    expect(screen.queryByText(/Encontramos um rascunho salvo/)).not.toBeInTheDocument()
    expect(queryClient.getQueryData(['dados-de-a'])).toBeUndefined()
  })

  it('salvamento ainda agendado (debounce) no momento do logout não recria o rascunho', async () => {
    const user = userEvent.setup()
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    renderApp(queryClient)

    await user.click(screen.getByRole('button', { name: 'Entrar como A' }))
    await digitarRascunhoEEsperarGravacao(user, conteudo)
    // Nova digitação agenda outro salvamento (800 ms); o logout vem antes dele.
    await user.type(screen.getByLabelText(/^Bairro/i), ' 2')
    await user.click(screen.getByRole('button', { name: 'Sair' }))

    await waitFor(async () => expect(await conteudo('ocorrencias')).toEqual({}))
    await act(() => new Promise((resolve) => setTimeout(resolve, 1200)))
    expect(await conteudo('ocorrencias')).toEqual({})
  })

  it('sessão expirada (401) limpa o cache mas preserva o rascunho do usuário', async () => {
    const user = userEvent.setup()
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    renderApp(queryClient)

    await user.click(screen.getByRole('button', { name: 'Entrar como A' }))
    await digitarRascunhoEEsperarGravacao(user, conteudo)
    queryClient.setQueryData(['dados-de-a'], 'só do A')

    act(() => {
      window.dispatchEvent(new Event('auth:unauthorized'))
    })

    expect(await screen.findByRole('button', { name: 'Entrar como A' })).toBeInTheDocument()
    await waitFor(() => expect(queryClient.getQueryData(['dados-de-a'])).toBeUndefined())
    expect(await conteudo('ocorrencias')).toHaveProperty(`${USUARIO_A.id}:novo`)

    await user.click(screen.getByRole('button', { name: 'Entrar como A' }))
    expect(await screen.findByText(/Encontramos um rascunho salvo/)).toBeInTheDocument()
  })

  it('401 durante o reenvio de anexos: a pendência fica, e o mesmo usuário reenvia depois de entrar de novo', async () => {
    const user = userEvent.setup()
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
    await salvarAnexosPendentes(USUARIO_A.id, {
      ocorrenciaId: OCORRENCIA_ABERTA_ID,
      protocolo: '089/2026',
      anexos: [new File(['b'], 'b.png', { type: 'image/png' })],
    })
    let sessaoValida = false
    let uploads = 0
    server.use(
      http.post(`${API_BASE_URL}/ocorrencias/${OCORRENCIA_ABERTA_ID}/anexos`, () => {
        if (!sessaoValida) return HttpResponse.json({ mensagem: 'Token expirado' }, { status: 401 })
        uploads += 1
        return HttpResponse.json(ANEXO_CRIADO_FIXTURE, { status: 201 })
      }),
    )
    renderApp(queryClient)

    await user.click(screen.getByRole('button', { name: 'Entrar como A' }))
    await user.click(await screen.findByRole('button', { name: 'Reenviar' }))

    expect(await screen.findByRole('button', { name: 'Entrar como A' })).toBeInTheDocument()
    expect((await conteudo('ocorrencias'))[`${USUARIO_A.id}:anexos-pendentes`]).toMatchObject({ ocorrenciaId: OCORRENCIA_ABERTA_ID })

    sessaoValida = true
    await user.click(screen.getByRole('button', { name: 'Entrar como A' }))
    await user.click(await screen.findByRole('button', { name: 'Reenviar' }))

    expect(await screen.findByText('Detalhe da ocorrência')).toBeInTheDocument()
    expect(uploads).toBe(1)
    expect(await conteudo('ocorrencias')).not.toHaveProperty(`${USUARIO_A.id}:anexos-pendentes`)
  })
})
