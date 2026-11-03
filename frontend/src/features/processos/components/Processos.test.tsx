import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AuthProvider, definirSessaoEmMemoria } from '@/features/auth/hooks/AuthContext'
import type { Usuario } from '@/features/auth/types/auth.types'
import { API_BASE_URL } from '@/lib/env'
import { server } from '@/mocks/server'
import { PROCESSO_PENDENTE_ID } from '@/mocks/processosFixtures'
import { Processos } from './Processos'

function renderProcessos(cargos = ['Administrador'], entrada = '/processos') {
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
      <MemoryRouter initialEntries={[entrada]}>
        <AuthProvider>
          <Processos />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function capturarListagens(totalPaginas = 1) {
  const chamadas: URLSearchParams[] = []
  server.use(
    http.get(`${API_BASE_URL}/processos`, ({ request }) => {
      const params = new URL(request.url).searchParams
      chamadas.push(params)
      return HttpResponse.json({ itens: [], pagina: Number(params.get('pagina')), tamanho: 20, totalItens: 0, totalPaginas })
    }),
  )
  return chamadas
}

describe('Processos - filtros', () => {
  it('"Em andamento" envia todos os status menos Concluído', async () => {
    const user = userEvent.setup()
    const chamadas = capturarListagens()
    renderProcessos()

    await user.selectOptions(await screen.findByLabelText('Filtrar por status'), 'Em andamento')

    await waitFor(() => expect(chamadas.at(-1)?.get('status')).toBe('ABERTO,AGUARDANDO_RESULTADO,COM_RESULTADO'))
  })

  it('envia o período de abertura ao servidor', async () => {
    const user = userEvent.setup()
    const chamadas = capturarListagens()
    renderProcessos()

    await user.type(await screen.findByLabelText('Abertura a partir de'), '2026-05-01')
    await user.type(screen.getByLabelText('Abertura até'), '2026-05-31')

    await waitFor(() => expect(chamadas.at(-1)?.get('ate')).toBe('2026-05-31'))
    expect(chamadas.at(-1)?.get('de')).toBe('2026-05-01')
  })

  it('"Só urgentes" liga e desliga com um clique', async () => {
    const user = userEvent.setup()
    const chamadas = capturarListagens()
    renderProcessos()

    const botao = await screen.findByRole('button', { name: 'Só urgentes' })
    expect(botao).toHaveAttribute('aria-pressed', 'false')

    await user.click(botao)
    await waitFor(() => expect(chamadas.at(-1)?.get('urgente')).toBe('true'))
    expect(botao).toHaveAttribute('aria-pressed', 'true')

    await user.click(botao)
    await waitFor(() => expect(chamadas.at(-1)?.has('urgente')).toBe(false))
  })

  it('o link do alerta do Dashboard abre só os urgentes', async () => {
    const chamadas = capturarListagens()
    renderProcessos(['Administrador'], '/processos?urgente=1')

    expect(await screen.findByRole('button', { name: 'Só urgentes' })).toHaveAttribute('aria-pressed', 'true')
    await waitFor(() => expect(chamadas.at(0)?.get('urgente')).toBe('true'))
  })
})

describe('Processos — listagem', () => {
  it('mostra os processos da API: protocolo, doença, status, data sem deslocamento de fuso e ocorrência vinculada', async () => {
    renderProcessos()

    const linha = (await screen.findByText('PS 045/2026')).closest('tr') as HTMLElement
    expect(within(linha).getByText('Raiva')).toBeInTheDocument()
    expect(within(linha).getByText('Aguardando resultado')).toBeInTheDocument()
    expect(within(linha).getByText('18/05/2026')).toBeInTheDocument()
    expect(within(linha).getByText('OC 092/2026')).toBeInTheDocument()
    expect(within(linha).getByText(/Urgente/)).toBeInTheDocument()
    expect(linha).toHaveClass('urgent')

    const semVinculo = screen.getByText('PS 046/2026').closest('tr') as HTMLElement
    expect(within(semVinculo).getByText('—')).toBeInTheDocument()
    expect(screen.getByText('2 registros')).toBeInTheDocument()
  })

  it('o link "Ver" aponta para o processo', async () => {
    renderProcessos()

    expect(await screen.findByRole('link', { name: 'Ver processo PS 045/2026' })).toHaveAttribute('href', `/processos/${PROCESSO_PENDENTE_ID}`)
  })

  it('filtros enviam o código da doença e o status da API, e voltam para a página 0', async () => {
    const chamadas = capturarListagens(3)
    const user = userEvent.setup()
    renderProcessos()

    await user.selectOptions(screen.getByLabelText('Filtrar por doença'), await screen.findByRole('option', { name: 'Esporotricose' }))
    await user.selectOptions(screen.getByLabelText('Filtrar por status'), 'CONCLUIDO')

    await waitFor(() => {
      const ultima = chamadas[chamadas.length - 1]
      expect(ultima.get('doenca')).toBe('esporotricose')
      expect(ultima.get('status')).toBe('CONCLUIDO')
      expect(ultima.get('pagina')).toBe('0')
    })
  })

  it('mudar de filtro depois de paginar volta para a página 0', async () => {
    const chamadas: URLSearchParams[] = []
    server.use(
      http.get(`${API_BASE_URL}/processos`, ({ request }) => {
        const params = new URL(request.url).searchParams
        chamadas.push(params)
        const pagina = Number(params.get('pagina'))
        return HttpResponse.json({
          itens: [{
            id: `p-${pagina}`,
            protocolo: `00${pagina + 1}/2026`,
            dataAbertura: '2026-05-01',
            doenca: { codigo: 'raiva', nome: 'Raiva' },
            statusProcesso: 'ABERTO',
            urgente: false,
            ocorrenciaId: null,
            ocorrenciaProtocolo: null,
          }],
          pagina,
          tamanho: 20,
          totalItens: 41,
          totalPaginas: 3,
        })
      }),
    )
    const user = userEvent.setup()
    renderProcessos()

    await user.click(await screen.findByRole('button', { name: 'Próximo' }))
    await screen.findByText('PS 002/2026')
    await user.selectOptions(screen.getByLabelText('Filtrar por status'), 'ABERTO')

    await waitFor(() => {
      const ultima = chamadas[chamadas.length - 1]
      expect(ultima.get('status')).toBe('ABERTO')
      expect(ultima.get('pagina')).toBe('0')
    })
  })

  it('estado vazio com filtro orienta a ajustar os filtros', async () => {
    capturarListagens()
    const user = userEvent.setup()
    renderProcessos()

    await user.selectOptions(screen.getByLabelText('Filtrar por status'), 'CONCLUIDO')

    expect(await screen.findByText('Nenhum processo sanitário encontrado')).toBeInTheDocument()
    expect(screen.getByText('Ajuste os filtros de busca.')).toBeInTheDocument()
  })

  it('estado vazio sem filtro informa que nenhum processo foi aberto', async () => {
    capturarListagens()
    renderProcessos()

    expect(await screen.findByText('Nenhum processo foi aberto ainda.')).toBeInTheDocument()
  })

  it('mostra erro quando a listagem falha', async () => {
    server.use(http.get(`${API_BASE_URL}/processos`, () => HttpResponse.json({ mensagem: 'erro' }, { status: 500 })))
    renderProcessos()

    expect(await screen.findByText('Não foi possível carregar os processos sanitários.')).toBeInTheDocument()
  })

  it('não mostra aviso de dados de demonstração', async () => {
    renderProcessos()

    await screen.findByText('PS 045/2026')
    expect(screen.queryByText(/Dados de demonstração/)).not.toBeInTheDocument()
  })

  it.each(['Administrador', 'Veterinário', 'Agente Sanitário'])(
    '%s vê "Novo processo" (PROCESSOS_SANITARIOS:escrita)',
    async (cargo) => {
      renderProcessos([cargo])

      expect(await screen.findByRole('link', { name: /Novo processo/ })).toHaveAttribute('href', '/processos/novo')
    },
  )
})
