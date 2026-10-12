import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AuthProvider, SESSION_STORAGE_KEY } from '@/features/auth/hooks/AuthContext'
import type { Usuario } from '@/features/auth/types/auth.types'
import { API_BASE_URL } from '@/lib/env'
import { server } from '@/mocks/server'
import {
  ocorrenciaEncerrada,
  ocorrenciaSigilosaVisivel,
  paraResumoFixture,
  resumosFixture,
} from '@/mocks/ocorrenciasFixtures'
import type { OcorrenciaResumo } from '../types/ocorrencias.types'
import { Ocorrencias } from './Ocorrencias'

function renderLista(cargos: string[]) {
  const usuario: Usuario = {
    id: 'a1b2c3d4-0000-0000-0000-000000000099',
    nome: 'Usuária',
    sobrenome: 'Teste',
    email: 'usuaria.teste@itu.sp.gov.br',
    cargos,
    senhaAlteradaEm: '2026-01-10T12:00:00Z',
  }
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ token: 'token-existente', usuario }))

  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/ocorrencias']}>
        <AuthProvider>
          <Routes>
            <Route path="/ocorrencias" element={<Ocorrencias />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function pagina(itens: OcorrenciaResumo[]) {
  return { itens, pagina: 0, tamanho: 20, totalItens: itens.length, totalPaginas: 1 }
}

// Registra os query params de cada GET /ocorrencias e responde com a lista
// fixa — ou com `filtrada` quando o param esperado aparece. O filtro em si é
// do backend; aqui só se confere o que a tela envia e o que ela exibe.
function capturarListagem(filtrada?: { param: string; valor: string; itens: OcorrenciaResumo[] }) {
  const chamadas: URLSearchParams[] = []
  server.use(
    http.get(`${API_BASE_URL}/ocorrencias`, ({ request }) => {
      const params = new URL(request.url).searchParams
      chamadas.push(params)
      if (filtrada && params.get(filtrada.param) === filtrada.valor) return HttpResponse.json(pagina(filtrada.itens))
      return HttpResponse.json(pagina(resumosFixture()))
    }),
  )
  return chamadas
}

describe('Ocorrencias', () => {
  it('renderiza a listagem com os protocolos prefixados por "OC" (D36)', async () => {
    renderLista(['Administrador'])

    expect(await screen.findByText('OC 089/2026')).toBeInTheDocument()
    expect(screen.getByText('OC 090/2026')).toBeInTheDocument()
    expect(screen.getByText('OC 091/2026')).toBeInTheDocument()
    expect(screen.getByText('OC 092/2026')).toBeInTheDocument()
    expect(screen.getByText('OC 070/2026')).toBeInTheDocument()
  })

  it('mantém a ordem do backend (urgentes primeiro) e marca a urgente com selo', async () => {
    renderLista(['Administrador'])
    await screen.findByText('OC 089/2026')

    const linhas = screen.getAllByRole('row').slice(1)
    expect(within(linhas[0]).getByText('OC 092/2026')).toBeInTheDocument()
    expect(within(linhas[0]).getByLabelText('Urgente')).toBeInTheDocument()
    expect(screen.getAllByLabelText('Urgente')).toHaveLength(1)
  })

  it('filtra por tipo enviando o parâmetro `tipo`', async () => {
    const user = userEvent.setup()
    const chamadas = capturarListagem({
      param: 'tipo',
      valor: 'agressivo',
      itens: [paraResumoFixture(ocorrenciaEncerrada())],
    })
    renderLista(['Administrador'])
    await screen.findByText('OC 089/2026')

    await user.selectOptions(screen.getByLabelText('Filtrar por tipo'), 'Animal Agressivo')

    await waitFor(() => expect(screen.queryByText('OC 089/2026')).not.toBeInTheDocument())
    expect(screen.getByText('OC 070/2026')).toBeInTheDocument()
    expect(chamadas.at(-1)?.get('tipo')).toBe('agressivo')
  })

  it('filtra por status enviando o parâmetro `status` em maiúsculas', async () => {
    const user = userEvent.setup()
    const chamadas = capturarListagem({
      param: 'status',
      valor: 'ENCERRADA',
      itens: [paraResumoFixture(ocorrenciaEncerrada())],
    })
    renderLista(['Administrador'])
    await screen.findByText('OC 089/2026')

    await user.selectOptions(screen.getByLabelText('Filtrar por status'), 'Encerrada')

    await waitFor(() => expect(screen.queryByText('OC 089/2026')).not.toBeInTheDocument())
    expect(screen.getByText('OC 070/2026')).toBeInTheDocument()
    expect(chamadas.at(-1)?.get('status')).toBe('ENCERRADA')
  })

  it('envia a busca como foi digitada, com o prefixo "OC" (o backend aceita com ou sem, D36)', async () => {
    const user = userEvent.setup()
    const chamadas = capturarListagem()
    renderLista(['Administrador'])
    await screen.findByText('OC 089/2026')

    await user.type(screen.getByPlaceholderText(/Buscar protocolo/i), 'OC 070')

    await waitFor(() => expect(chamadas.at(-1)?.get('q')).toBe('OC 070'))
  })

  it('mostra "Sigiloso" na coluna denunciante quando o backend nega a visão (podeVerDenunciante=false)', async () => {
    renderLista(['Veterinário'])

    const linha = (await screen.findByText('OC 090/2026')).closest('tr') as HTMLElement
    expect(within(linha).getByText('Sigiloso')).toBeInTheDocument()
    expect(screen.queryByText('João Pereira Lima')).not.toBeInTheDocument()
  })

  it('mostra o nome do denunciante sigiloso quando o backend libera a visão (podeVerDenunciante=true)', async () => {
    server.use(
      http.get(`${API_BASE_URL}/ocorrencias`, () =>
        HttpResponse.json(pagina([paraResumoFixture(ocorrenciaSigilosaVisivel())])),
      ),
    )
    renderLista(['Agente Sanitário'])

    const linha = (await screen.findByText('OC 090/2026')).closest('tr') as HTMLElement
    expect(within(linha).getByText('João Pereira Lima')).toBeInTheDocument()
    expect(within(linha).queryByText('Sigiloso')).not.toBeInTheDocument()
  })

  it('mostra "Anônima" na coluna denunciante da denúncia anônima', async () => {
    renderLista(['Administrador'])

    const linha = (await screen.findByText('OC 091/2026')).closest('tr') as HTMLElement
    expect(within(linha).getByText('Anônima')).toBeInTheDocument()
  })

  it('o link "Ver" aponta para o detalhe da ocorrência certa', async () => {
    renderLista(['Administrador'])
    await screen.findByText('OC 089/2026')

    const link = screen.getByRole('link', { name: /ver ocorrência OC 089\/2026/i })
    expect(link).toHaveAttribute('href', '/ocorrencias/h5000000-0000-0000-0000-000000000001')
  })

  it('a coluna "Processo Vinc." mostra o protocolo com prefixo "PS", sem link (processos ainda é demonstração, D40)', async () => {
    renderLista(['Administrador'])
    await screen.findByText('OC 092/2026')

    expect(screen.getByText('PS 045/2026')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /045\/2026/ })).not.toBeInTheDocument()
  })

  it('mostra erro amigável quando a listagem falha', async () => {
    server.use(http.get(`${API_BASE_URL}/ocorrencias`, () => HttpResponse.json({}, { status: 500 })))
    renderLista(['Administrador'])

    expect(await screen.findByText('Não foi possível carregar as ocorrências. Tente novamente.')).toBeInTheDocument()
  })

  it('não mostra o botão "Registrar Ocorrência" para o perfil Veterinário', async () => {
    renderLista(['Veterinário'])
    await screen.findByText('OC 089/2026')

    expect(screen.queryByRole('link', { name: /registrar ocorrência/i })).not.toBeInTheDocument()
  })

  it('mostra o botão "Registrar Ocorrência" para Administrador e Agente Sanitário', async () => {
    renderLista(['Agente Sanitário'])
    await screen.findByText('OC 089/2026')

    expect(screen.getByRole('link', { name: /registrar ocorrência/i })).toBeInTheDocument()
  })
})
