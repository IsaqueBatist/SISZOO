import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'
import { Sidebar } from './Sidebar'
import { AuthProvider, SESSION_STORAGE_KEY } from '@/features/auth/hooks/AuthContext'
import type { Usuario } from '@/features/auth/types/auth.types'
import {
  useCriarOcorrenciaMutation,
  useIniciarAtendimentoMutation,
} from '@/features/ocorrencias/hooks/useOcorrencias'
import { API_BASE_URL } from '@/lib/env'
import { server } from '@/mocks/server'

// Responde ao contador do menu (status=ABERTA, tamanho=1) com `total()` e
// conta as chamadas; as demais listagens não são usadas aqui.
function contadorDeAbertas(total: () => number) {
  const chamadas: string[] = []
  server.use(
    http.get(`${API_BASE_URL}/ocorrencias`, ({ request }) => {
      const url = new URL(request.url)
      chamadas.push(url.search)
      return HttpResponse.json({ itens: [], pagina: 0, tamanho: 1, totalItens: total(), totalPaginas: 1 })
    }),
  )
  return chamadas
}

function AcoesDeOcorrencia() {
  const criar = useCriarOcorrenciaMutation()
  const iniciar = useIniciarAtendimentoMutation('h5000000-0000-0000-0000-000000000001')
  return (
    <>
      <button
        type="button"
        onClick={() =>
          criar.mutate({
            tipoOcorrencia: 'outros',
            dataAbertura: '2026-09-10',
            endereco: 'Rua das Acácias, 120',
            bairro: 'Centro',
            descricao: 'Teste do contador',
            urgente: false,
            sigilosa: false,
            anonima: true,
          })
        }
      >
        criar
      </button>
      <button type="button" onClick={() => iniciar.mutate()}>
        iniciar
      </button>
    </>
  )
}

function renderSidebar(cargos: string[], collapsed = false, onToggleCollapsed = vi.fn(), comAcoes = false) {
  const usuario: Usuario = {
    id: 'a1b2c3d4-0000-0000-0000-000000000001',
    nome: 'Stéphanie',
    sobrenome: 'Lima',
    email: 'stephanie.lima@itu.sp.gov.br',
    cargos,
    senhaAlteradaEm: '2026-01-10T12:00:00Z',
  }
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ token: 'token-existente', usuario }))

  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AuthProvider>
          <Sidebar collapsed={collapsed} onToggleCollapsed={onToggleCollapsed} />
          {comAcoes && <AcoesDeOcorrencia />}
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function linkOcorrencias() {
  return screen.getByRole('link', { name: /ocorrências/i })
}

describe('Sidebar', () => {
  it('perfil admin vê o item de menu "Usuários"', () => {
    renderSidebar(['Administrador'])

    expect(screen.getByRole('link', { name: /usuários/i })).toBeInTheDocument()
  })

  it('perfil agente não vê o item de menu "Usuários"', () => {
    renderSidebar(['Agente Sanitário'])

    expect(screen.queryByRole('link', { name: /usuários/i })).not.toBeInTheDocument()
  })

  it('colapsada, os itens de menu continuam com nome acessível (texto visualmente escondido, não removido)', () => {
    renderSidebar(['Administrador'], true)

    // getByRole por nome só encontra se o texto ainda existir no DOM (ainda
    // que visualmente escondido) — display:none falharia esse teste.
    expect(screen.getByRole('link', { name: /animais/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /usuários/i })).toBeInTheDocument()
  })

  it('título/aria-expanded do botão de alternar refletem o estado atual', () => {
    const { rerender } = renderSidebar(['Administrador'], false)
    const botao = screen.getByRole('button', { name: /recolher menu/i })
    expect(botao).toHaveAttribute('aria-expanded', 'true')
    expect(botao).toHaveAttribute('title', 'Recolher')

    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <AuthProvider>
            <Sidebar collapsed onToggleCollapsed={vi.fn()} />
          </AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    )
    const botaoColapsado = screen.getByRole('button', { name: /expandir menu/i })
    expect(botaoColapsado).toHaveAttribute('aria-expanded', 'false')
    expect(botaoColapsado).toHaveAttribute('title', 'Expandir')
  })

  it('clique no botão de alternar chama onToggleCollapsed', async () => {
    const onToggleCollapsed = vi.fn()
    const user = userEvent.setup()
    renderSidebar(['Administrador'], false, onToggleCollapsed)

    await user.click(screen.getByRole('button', { name: /recolher menu/i }))

    expect(onToggleCollapsed).toHaveBeenCalledTimes(1)
  })

  describe('contador de ocorrências abertas', () => {
    it('mostra o total real de ocorrências ABERTA vindo da API', async () => {
      const chamadas = contadorDeAbertas(() => 3)

      renderSidebar(['Agente Sanitário'])

      expect(await screen.findByTitle('3 ocorrências abertas')).toHaveTextContent('3')
      expect(chamadas[0]).toContain('status=ABERTA')
      expect(chamadas[0]).toContain('tamanho=1')
    })

    it('não mostra número quando não há ocorrência aberta', async () => {
      const chamadas = contadorDeAbertas(() => 0)

      renderSidebar(['Administrador'])

      await waitFor(() => expect(chamadas).toHaveLength(1))
      expect(linkOcorrencias().querySelector('.badge-count')).toBeNull()
    })

    it('não mostra número (nem inventa um) quando a API falha', async () => {
      let chamadas = 0
      server.use(
        http.get(`${API_BASE_URL}/ocorrencias`, () => {
          chamadas += 1
          return HttpResponse.json({ mensagem: 'Erro interno' }, { status: 500 })
        }),
      )

      renderSidebar(['Administrador'])

      await waitFor(() => expect(chamadas).toBeGreaterThan(0))
      expect(linkOcorrencias().querySelector('.badge-count')).toBeNull()
    })

    it('perfil sem acesso ao módulo (Veterinário) não consulta a contagem', async () => {
      const chamadas = contadorDeAbertas(() => 3)

      renderSidebar(['Veterinário'])

      expect(screen.queryByRole('link', { name: /ocorrências/i })).not.toBeInTheDocument()
      // Dá tempo de uma requisição indevida acontecer antes de conferir.
      await new Promise((resolve) => setTimeout(resolve, 50))
      expect(chamadas).toHaveLength(0)
    })

    it('atualiza depois de criar (N+1) e de iniciar o atendimento (N−1)', async () => {
      let abertas = 3
      contadorDeAbertas(() => abertas)
      const user = userEvent.setup()

      renderSidebar(['Agente Sanitário'], false, vi.fn(), true)
      expect(await screen.findByTitle('3 ocorrências abertas')).toBeInTheDocument()

      abertas = 4
      await user.click(screen.getByRole('button', { name: 'criar' }))
      expect(await screen.findByTitle('4 ocorrências abertas')).toBeInTheDocument()

      abertas = 3
      await user.click(screen.getByRole('button', { name: 'iniciar' }))
      expect(await screen.findByTitle('3 ocorrências abertas')).toBeInTheDocument()
    })
  })

  it('cargo sem perfil reconhecido não vê nenhum módulo no menu', () => {
    renderSidebar(['Cargo Desconhecido'])

    expect(screen.queryByRole('link', { name: /animais/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /ocorrências/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /dashboard/i })).not.toBeInTheDocument()
  })
})
