import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { HttpResponse, http as mswHttp } from 'msw'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { http } from '@/lib/http'
import { API_BASE_URL } from '@/lib/env'
import { reiniciarCanal } from '@/lib/sessao/canal'
import { LIMITE_INATIVIDADE_MS, registrarAtividade, registrarExtensao, ultimaAtividade } from '@/lib/sessao/atividade'
import { TEXTO_AVISO_INATIVIDADE } from '@/lib/sessao/useSessaoAtiva'
import { server } from '@/mocks/server'
import { RotaProtegida } from '@/routes/RotaProtegida'
import { Toasts } from '@/components/toast/Toasts'
import { Login } from '../components/Login'
import type { Usuario } from '../types/auth.types'
import { AuthProvider, definirSessaoEmMemoria } from './AuthContext'
import { useAuth } from './useAuth'

const MINUTO = 60 * 1000

const USUARIO: Usuario = {
  id: 'a1b2c3d4-0000-0000-0000-000000000099',
  nome: 'Ana',
  sobrenome: 'Silva',
  email: 'ana.silva@itu.sp.gov.br',
  cargos: ['Administrador'],
  senhaAlteradaEm: '2026-01-10T12:00:00Z',
}

class CanalSimulado {
  static instancias: CanalSimulado[] = []
  private ouvintes = new Set<(evento: MessageEvent) => void>()

  constructor() {
    CanalSimulado.instancias.push(this)
  }

  postMessage(dados: unknown) {
    for (const outra of CanalSimulado.instancias) {
      if (outra === this) continue
      for (const ouvinte of outra.ouvintes) ouvinte({ data: dados } as MessageEvent)
    }
  }

  addEventListener(_tipo: string, ouvinte: (evento: MessageEvent) => void) {
    this.ouvintes.add(ouvinte)
  }

  removeEventListener(_tipo: string, ouvinte: (evento: MessageEvent) => void) {
    this.ouvintes.delete(ouvinte)
  }

  close() {
    CanalSimulado.instancias = CanalSimulado.instancias.filter((instancia) => instancia !== this)
  }
}

function outraAba() {
  return new CanalSimulado()
}

function LocalAtual() {
  const { pathname } = useLocation()
  return <span data-testid="local">{pathname}</span>
}

function renderApp(rota = '/painel') {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={[rota]}>
        <AuthProvider>
          <LocalAtual />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<RotaProtegida />}>
              <Route path="/painel" element={<div>Painel</div>} />
            </Route>
          </Routes>
        </AuthProvider>
      </MemoryRouter>
      <Toasts />
    </QueryClientProvider>,
  )
}

function renovacaoAceita(chamadas: Array<{ houveAtividade: boolean }> = []) {
  server.use(
    mswHttp.post(`${API_BASE_URL}/auth/renovar`, async ({ request }) => {
      chamadas.push((await request.json()) as { houveAtividade: boolean })
      return HttpResponse.json({ token: 'token-renovado', usuario: USUARIO })
    }),
  )
  return chamadas
}

function entrarSemTela() {
  registrarAtividade()
  registrarExtensao()
  definirSessaoEmMemoria({ token: 'token-atual', usuario: USUARIO })
}

beforeEach(() => {
  reiniciarCanal()
  CanalSimulado.instancias = []
  vi.stubGlobal('BroadcastChannel', CanalSimulado)
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  reiniciarCanal()
})

describe('abrir o SISZOO em outra aba', () => {
  it('entra sem pedir login quando o cookie ainda vale', async () => {
    renovacaoAceita()

    renderApp()

    expect(screen.getByText(/carregando sua sessão/i)).toBeInTheDocument()
    expect(await screen.findByText('Painel')).toBeInTheDocument()
    expect(screen.getByTestId('local')).toHaveTextContent('/painel')
  })

  it('sem sessão no servidor, vai para o login e guarda o destino', async () => {
    renderApp()

    expect(await screen.findByRole('button', { name: 'Entrar' })).toBeInTheDocument()
    expect(screen.getByTestId('local')).toHaveTextContent('/login')
  })

  it('abrir uma aba estando em /login com sessão válida leva para dentro', async () => {
    renovacaoAceita()

    renderApp('/login')

    await waitFor(() => expect(screen.getByTestId('local')).toHaveTextContent('/dashboard'))
  })

  it('login em outra aba conecta esta aba, que estava no login', async () => {
    renderApp()
    await screen.findByRole('button', { name: 'Entrar' })
    renovacaoAceita()

    act(() => outraAba().postMessage('login'))

    await waitFor(() => expect(screen.getByTestId('local')).toHaveTextContent('/painel'))
  })
})

describe('encerramento entre abas', () => {
  it('logout em outra aba tira esta aba da sessão, sem dizer que expirou', async () => {
    entrarSemTela()
    renderApp()
    expect(screen.getByText('Painel')).toBeInTheDocument()

    act(() => outraAba().postMessage('logout'))

    expect(await screen.findByRole('button', { name: 'Entrar' })).toBeInTheDocument()
    expect(screen.queryByText(/sua sessão expirou/i)).not.toBeInTheDocument()
  })

  it('expiração por inatividade em outra aba aparece aqui com o motivo', async () => {
    entrarSemTela()
    renderApp()

    act(() => outraAba().postMessage('inatividade'))

    expect(await screen.findByText(/sua sessão expirou por inatividade/i)).toBeInTheDocument()
  })

  it('sair chama o servidor e avisa as outras abas', async () => {
    const logout = vi.fn(() => new HttpResponse(null, { status: 204 }))
    server.use(mswHttp.post(`${API_BASE_URL}/auth/logout`, logout))
    const outra = outraAba()
    const recebido = vi.fn()
    outra.addEventListener('message', recebido)
    entrarSemTela()
    function Sair() {
      const { logout: sair } = useAuth()
      return <button onClick={sair}>sair</button>
    }

    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <AuthProvider>
            <Sair />
          </AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'sair' }))

    await waitFor(() => expect(logout).toHaveBeenCalledTimes(1))
    expect(recebido).toHaveBeenCalledWith({ data: 'logout' })
  })
})

describe('renovação do token de acesso', () => {
  it('vários 401 em paralelo fazem uma renovação só, e todas as requisições são repetidas', async () => {
    entrarSemTela()
    const chamadas = renovacaoAceita()
    server.use(
      mswHttp.get(`${API_BASE_URL}/teste`, ({ request }) =>
        request.headers.get('Authorization') === 'Bearer token-renovado'
          ? HttpResponse.json({ ok: true })
          : HttpResponse.json({ mensagem: 'expirado' }, { status: 401 }),
      ),
    )
    renderApp()

    const respostas = await Promise.all([1, 2, 3, 4, 5].map(() => http.get('/teste')))

    expect(respostas.every((resposta) => resposta.status === 200)).toBe(true)
    expect(chamadas).toHaveLength(1)
  })

  it('duas abas renovam uma de cada vez, pela trava do navegador', async () => {
    const request = vi.fn((_nome: string, acao: () => Promise<unknown>) => acao())
    vi.stubGlobal('navigator', { ...navigator, locks: { request } })
    entrarSemTela()
    renovacaoAceita()
    server.use(
      mswHttp.get(`${API_BASE_URL}/teste`, ({ request: pedido }) =>
        pedido.headers.get('Authorization') === 'Bearer token-renovado'
          ? HttpResponse.json({ ok: true })
          : HttpResponse.json({}, { status: 401 }),
      ),
    )
    renderApp()

    await http.get('/teste')

    expect(request).toHaveBeenCalledWith('siszoo-renovacao', expect.any(Function))
  })

  it('falha na renovação com 401 encerra a sessão, mesmo com várias requisições em paralelo, e guarda a tela', async () => {
    entrarSemTela()
    server.use(mswHttp.get(`${API_BASE_URL}/teste`, () => HttpResponse.json({}, { status: 401 })))
    renderApp()

    await Promise.allSettled([1, 2, 3].map(() => http.get('/teste')))

    expect(await screen.findByText(/^Sua sessão expirou\./)).toBeInTheDocument()
    expect(screen.getByTestId('local')).toHaveTextContent('/login')
  })

  it('queda de rede na renovação não encerra a sessão', async () => {
    entrarSemTela()
    server.use(
      mswHttp.get(`${API_BASE_URL}/teste`, () => HttpResponse.json({}, { status: 401 })),
      mswHttp.post(`${API_BASE_URL}/auth/renovar`, () => HttpResponse.error()),
    )
    renderApp()

    await expect(http.get('/teste')).rejects.toBeDefined()

    expect(screen.getByText('Painel')).toBeInTheDocument()
  })

  it('token repetido que volta com 401 não entra em laço', async () => {
    entrarSemTela()
    const chamadas = renovacaoAceita()
    server.use(mswHttp.get(`${API_BASE_URL}/teste`, () => HttpResponse.json({}, { status: 401 })))
    renderApp()

    await expect(http.get('/teste')).rejects.toBeDefined()

    expect(chamadas).toHaveLength(1)
    expect(await screen.findByRole('button', { name: 'Entrar' })).toBeInTheDocument()
  })
})

describe('inatividade', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] })
  })

  function passar(ms: number) {
    act(() => {
      vi.advanceTimersByTime(ms)
    })
  }

  it('avisa 5 minutos antes e expira aos 60 minutos sem atividade, preservando o destino', async () => {
    entrarSemTela()
    renderApp()

    passar(54 * MINUTO)
    expect(screen.queryByText(TEXTO_AVISO_INATIVIDADE)).not.toBeInTheDocument()

    passar(1.5 * MINUTO)
    expect(screen.getByText(TEXTO_AVISO_INATIVIDADE)).toBeInTheDocument()

    passar(5 * MINUTO)
    vi.useRealTimers()
    expect(await screen.findByText(/sua sessão expirou por inatividade/i)).toBeInTheDocument()
    expect(screen.getByTestId('local')).toHaveTextContent('/login')
  })

  it('requisição sem interação não conta como atividade', async () => {
    entrarSemTela()
    const chamadas = renovacaoAceita()
    server.use(
      mswHttp.get(`${API_BASE_URL}/teste`, ({ request }) =>
        request.headers.get('Authorization') === 'Bearer token-renovado'
          ? HttpResponse.json({ ok: true })
          : HttpResponse.json({}, { status: 401 }),
      ),
    )
    renderApp()
    const atividadeAntes = ultimaAtividade()

    passar(20 * MINUTO)
    await http.get('/teste')

    expect(chamadas).toEqual([{ houveAtividade: false }])
    expect(ultimaAtividade()).toBe(atividadeAntes)
  })

  it('interagir mantém a sessão e estende no servidor no máximo uma vez por minuto', async () => {
    entrarSemTela()
    const chamadas = renovacaoAceita()
    renderApp()

    passar(50 * MINUTO)
    fireEvent.pointerDown(window)
    fireEvent.keyDown(window)
    await vi.waitFor(() => expect(chamadas).toEqual([{ houveAtividade: true }]))

    passar(30 * 1000)
    fireEvent.pointerDown(window)
    expect(chamadas).toHaveLength(1)

    passar(50 * MINUTO)
    expect(screen.getByText('Painel')).toBeInTheDocument()
  })

  it('trabalhar em outra aba mantém esta aba aberta', () => {
    entrarSemTela()
    renderApp()

    passar(50 * MINUTO)
    registrarAtividade()
    passar(50 * MINUTO)

    expect(screen.getByText('Painel')).toBeInTheDocument()
  })

  it('interagir depois do limite não ressuscita a sessão', async () => {
    entrarSemTela()
    const chamadas = renovacaoAceita()
    renderApp()

    vi.setSystemTime(Date.now() + LIMITE_INATIVIDADE_MS + MINUTO)
    fireEvent.pointerDown(window)
    vi.useRealTimers()

    expect(await screen.findByText(/sua sessão expirou por inatividade/i)).toBeInTheDocument()
    expect(chamadas).toHaveLength(0)
  })

  it('servidor recusar a extensão encerra a sessão', async () => {
    entrarSemTela()
    server.use(mswHttp.post(`${API_BASE_URL}/auth/renovar`, () => HttpResponse.json({}, { status: 401 })))
    renderApp()

    passar(5 * MINUTO)
    fireEvent.pointerDown(window)
    vi.useRealTimers()

    expect(await screen.findByText(/^Sua sessão expirou\./)).toBeInTheDocument()
  })
})
