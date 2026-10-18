import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider, SESSION_STORAGE_KEY } from '@/features/auth/hooks/AuthContext'
import type { Usuario } from '@/features/auth/types/auth.types'
import { API_BASE_URL } from '@/lib/env'
import { server } from '@/mocks/server'
import {
  ANEXO_ENCERRADA_ID,
  DENUNCIANTE_MASCARADO,
  OCORRENCIA_ABERTA_ID,
  OCORRENCIA_ANONIMA_ID,
  OCORRENCIA_ENCERRADA_ID,
  OCORRENCIA_PROCESSO_PENDENTE_ID,
  OCORRENCIA_SIGILOSA_ID,
  ocorrenciaAbertaFixture,
  ocorrenciaSigilosaVisivel,
} from '@/mocks/ocorrenciasFixtures'
import { OcorrenciaDetalhe } from './OcorrenciaDetalhe'

function renderDetalhe(ocorrenciaId: string, cargos: string[]) {
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
      <MemoryRouter initialEntries={[`/ocorrencias/${ocorrenciaId}`]}>
        <AuthProvider>
          <Routes>
            <Route path="/ocorrencias/:id" element={<OcorrenciaDetalhe />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('OcorrenciaDetalhe', () => {
  it('renderiza os dados gerais com o prefixo "OC", denunciante, movimentações e anexos', async () => {
    renderDetalhe(OCORRENCIA_ENCERRADA_ID, ['Administrador'])

    expect(await screen.findByRole('heading', { name: 'Ocorrência OC 070/2026', level: 1 })).toBeInTheDocument()
    expect(screen.getByText('Escola Municipal Parque das Flores')).toBeInTheDocument()
    expect(screen.getByText('Foto do animal.jpg')).toBeInTheDocument()
    expect(screen.getByText('10/05/2026 · 08:00', { selector: '.mono' })).toBeInTheDocument()
  })

  it('mostra o placeholder "Sigiloso" quando o backend nega a visão do denunciante (podeVerDenunciante=false)', async () => {
    renderDetalhe(OCORRENCIA_SIGILOSA_ID, ['Veterinário'])

    await screen.findByRole('heading', { name: 'Ocorrência OC 090/2026', level: 1 })
    expect(screen.getAllByText('Sigiloso').length).toBeGreaterThan(0)
    expect(screen.queryByText('João Pereira Lima')).not.toBeInTheDocument()
  })

  it('mostra os dados reais do denunciante sigiloso quando o backend libera a visão (podeVerDenunciante=true)', async () => {
    server.use(http.get(`${API_BASE_URL}/ocorrencias/${OCORRENCIA_SIGILOSA_ID}`, () => HttpResponse.json(ocorrenciaSigilosaVisivel())))
    renderDetalhe(OCORRENCIA_SIGILOSA_ID, ['Administrador'])

    await screen.findByRole('heading', { name: 'Ocorrência OC 090/2026', level: 1 })
    expect(screen.getByText('João Pereira Lima')).toBeInTheDocument()
    expect(screen.queryByText('Sigiloso')).not.toBeInTheDocument()
  })

  it('[A04] depois de uma mutação, quem tem acesso continua vendo o denunciante sigiloso (resposta mascarada não vai para a tela)', async () => {
    const user = userEvent.setup()
    let leiturasDoDetalhe = 0
    server.use(
      http.get(`${API_BASE_URL}/ocorrencias/${OCORRENCIA_SIGILOSA_ID}`, () => {
        leiturasDoDetalhe += 1
        return HttpResponse.json(ocorrenciaSigilosaVisivel())
      }),
      // Como o backend: a resposta da mutação traz o denunciante mascarado
      // mesmo para quem tem a permissão.
      http.post(`${API_BASE_URL}/ocorrencias/${OCORRENCIA_SIGILOSA_ID}/notas`, () =>
        HttpResponse.json({ ...ocorrenciaSigilosaVisivel(), denunciante: DENUNCIANTE_MASCARADO }, { status: 201 }),
      ),
    )
    renderDetalhe(OCORRENCIA_SIGILOSA_ID, ['Administrador'])
    expect(await screen.findByText('João Pereira Lima')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Nova nota interna'), 'Nota em sigilosa')
    await user.click(screen.getByRole('button', { name: 'Adicionar nota' }))

    await waitFor(() => expect(leiturasDoDetalhe).toBe(2))
    await waitFor(() => expect(screen.getByLabelText('Nova nota interna')).toHaveValue(''))
    expect(screen.getByText('João Pereira Lima')).toBeInTheDocument()
    expect(screen.queryByText('Sigiloso')).not.toBeInTheDocument()
  })

  it('mostra a denúncia anônima sem campos de denunciante', async () => {
    renderDetalhe(OCORRENCIA_ANONIMA_ID, ['Administrador'])

    await screen.findByRole('heading', { name: 'Ocorrência OC 091/2026', level: 1 })
    expect(screen.getByText(/Denúncia anônima:/)).toBeInTheDocument()
    expect(screen.queryByText('Sigiloso')).not.toBeInTheDocument()
  })

  it('não mostra o formulário de encerramento para o perfil Veterinário (sem escrita)', async () => {
    renderDetalhe(OCORRENCIA_ABERTA_ID, ['Veterinário'])

    await screen.findByRole('heading', { name: 'Ocorrência OC 089/2026', level: 1 })
    expect(screen.queryByLabelText('Providência tomada')).not.toBeInTheDocument()
    expect(screen.getByText('Seu perfil não pode encerrar ocorrências')).toBeInTheDocument()
  })

  it('mostra os dados de encerramento (nome da providência vindo do backend) e nenhum formulário para uma ocorrência já encerrada', async () => {
    renderDetalhe(OCORRENCIA_ENCERRADA_ID, ['Administrador'])

    await screen.findByRole('heading', { name: 'Ocorrência OC 070/2026', level: 1 })
    expect(screen.queryByLabelText('Providência tomada')).not.toBeInTheDocument()
    expect(screen.getByText('Captura e remoção')).toBeInTheDocument()
    expect(screen.getByText('Stéphanie Lima', { selector: '.v' })).toBeInTheDocument()
  })

  it('mostra a linha do tempo em ordem cronológica decrescente, com tipo, data e autor', async () => {
    renderDetalhe(OCORRENCIA_ENCERRADA_ID, ['Administrador'])

    await screen.findByRole('heading', { name: 'Ocorrência OC 070/2026', level: 1 })

    const titulos = screen
      .getAllByText(/Ocorrência encerrada|Equipe despachada|Ocorrência registrada/)
      .map((el) => el.textContent)
    expect(titulos).toEqual(['Ocorrência encerrada', 'Equipe despachada', 'Ocorrência registrada'])
    expect(screen.getByText('12/05/2026 · 13:00')).toBeInTheDocument()
  })

  // A04: depois da mutação a tela recarrega o detalhe pelo GET; o handler do
  // GET devolve o estado que a mutação gravou, como o backend.
  it('encerra a ocorrência: envia a providência e mostra o estado recarregado do backend', async () => {
    const user = userEvent.setup()
    const corpos: unknown[] = []
    let estado = ocorrenciaAbertaFixture()
    server.use(
      http.get(`${API_BASE_URL}/ocorrencias/${OCORRENCIA_ABERTA_ID}`, () => HttpResponse.json(estado)),
      http.post(`${API_BASE_URL}/ocorrencias/${OCORRENCIA_ABERTA_ID}/encerramento`, async ({ request }) => {
        corpos.push(await request.json())
        const aberta = ocorrenciaAbertaFixture()
        estado = {
          ...aberta,
          statusOcorrencia: 'ENCERRADA',
          providenciaTomada: 'sem_acao',
          providenciaTomadaNome: 'Sem ação necessária',
          encerradaEm: '2026-05-20T11:00:00',
          encerradaPorNome: 'Usuária Teste',
          movimentacoes: [
            ...aberta.movimentacoes,
            {
              id: 'h6000000-0000-0000-0000-000000000098',
              tipoMovimentacao: 'ENCERRADA',
              statusAnterior: 'ABERTA',
              statusNovo: 'ENCERRADA',
              data: '2026-05-20T11:00:00',
              descricao: 'Providência: Sem ação necessária',
              usuarioId: 'a1b2c3d4-0000-0000-0000-000000000099',
              usuarioNome: 'Usuária Teste',
            },
          ],
        }
        return HttpResponse.json(estado)
      }),
    )
    renderDetalhe(OCORRENCIA_ABERTA_ID, ['Administrador'])

    await screen.findByRole('heading', { name: 'Ocorrência OC 089/2026', level: 1 })
    // Opções vêm do catálogo (GET /ocorrencias/catalogos).
    await user.selectOptions(
      screen.getByLabelText('Providência tomada'),
      await screen.findByRole('option', { name: 'Sem ação necessária' }),
    )
    await user.click(screen.getByRole('button', { name: 'Encerrar ocorrência' }))

    expect(await screen.findByText('Ocorrência encerrada')).toBeInTheDocument()
    expect(screen.queryByLabelText('Providência tomada')).not.toBeInTheDocument()
    expect(screen.getByText('Sem ação necessária')).toBeInTheDocument()
    expect(corpos).toEqual([{ providenciaTomada: 'sem_acao' }])
  })

  it('mostra a mensagem do backend quando o encerramento é recusado (422)', async () => {
    const user = userEvent.setup()
    server.use(
      http.post(`${API_BASE_URL}/ocorrencias/${OCORRENCIA_ABERTA_ID}/encerramento`, () =>
        HttpResponse.json({ mensagem: 'Transicao de status invalida' }, { status: 422 }),
      ),
    )
    renderDetalhe(OCORRENCIA_ABERTA_ID, ['Administrador'])

    await screen.findByRole('heading', { name: 'Ocorrência OC 089/2026', level: 1 })
    // Opções vêm do catálogo (GET /ocorrencias/catalogos).
    await user.selectOptions(
      screen.getByLabelText('Providência tomada'),
      await screen.findByRole('option', { name: 'Sem ação necessária' }),
    )
    await user.click(screen.getByRole('button', { name: 'Encerrar ocorrência' }))

    expect(await screen.findByText('Transicao de status invalida')).toBeInTheDocument()
  })

  it('mostra "Iniciar Atendimento" para Admin/Agente quando a ocorrência está aberta', async () => {
    renderDetalhe(OCORRENCIA_ABERTA_ID, ['Agente Sanitário'])

    expect(await screen.findByRole('button', { name: 'Iniciar Atendimento' })).toBeInTheDocument()
  })

  it('não mostra "Iniciar Atendimento" para o perfil Veterinário', async () => {
    renderDetalhe(OCORRENCIA_ABERTA_ID, ['Veterinário'])

    await screen.findByRole('heading', { name: 'Ocorrência OC 089/2026', level: 1 })
    expect(screen.queryByRole('button', { name: 'Iniciar Atendimento' })).not.toBeInTheDocument()
  })

  it('não mostra "Iniciar Atendimento" quando a ocorrência já não está aberta', async () => {
    renderDetalhe(OCORRENCIA_PROCESSO_PENDENTE_ID, ['Administrador'])

    await screen.findByRole('heading', { name: 'Ocorrência OC 092/2026', level: 1 })
    expect(screen.queryByRole('button', { name: 'Iniciar Atendimento' })).not.toBeInTheDocument()
  })

  it('mostra o processo vinculado com prefixo "PS" e status legível, sem link (processos ainda é demonstração, D40)', async () => {
    renderDetalhe(OCORRENCIA_PROCESSO_PENDENTE_ID, ['Administrador'])

    await screen.findByRole('heading', { name: 'Ocorrência OC 092/2026', level: 1 })
    expect(screen.getByText('PS 045/2026')).toBeInTheDocument()
    expect(screen.getByText('Aguardando resultado')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Processo Sanitário Vinculado/ })).not.toBeInTheDocument()
  })

  it('inicia o atendimento: envia EM_ATENDIMENTO, o badge muda e a transição entra na timeline', async () => {
    const user = userEvent.setup()
    const corpos: unknown[] = []
    let estado = ocorrenciaAbertaFixture()
    server.use(
      http.get(`${API_BASE_URL}/ocorrencias/${OCORRENCIA_ABERTA_ID}`, () => HttpResponse.json(estado)),
      http.patch(`${API_BASE_URL}/ocorrencias/${OCORRENCIA_ABERTA_ID}/status`, async ({ request }) => {
        corpos.push(await request.json())
        const aberta = ocorrenciaAbertaFixture()
        estado = {
          ...aberta,
          statusOcorrencia: 'EM_ATENDIMENTO',
          movimentacoes: [
            ...aberta.movimentacoes,
            {
              id: 'h6000000-0000-0000-0000-000000000097',
              tipoMovimentacao: 'EQUIPE_DESPACHADA',
              statusAnterior: 'ABERTA',
              statusNovo: 'EM_ATENDIMENTO',
              data: '2026-05-20T10:50:00',
              descricao: null,
              usuarioId: 'a1b2c3d4-0000-0000-0000-000000000099',
              usuarioNome: 'Usuária Teste',
            },
          ],
        }
        return HttpResponse.json(estado)
      }),
    )
    renderDetalhe(OCORRENCIA_ABERTA_ID, ['Administrador'])

    await user.click(await screen.findByRole('button', { name: 'Iniciar Atendimento' }))

    expect(await screen.findByText('Em atendimento')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Iniciar Atendimento' })).not.toBeInTheDocument()
    expect(screen.getByText('Equipe despachada')).toBeInTheDocument()
    expect(screen.getByText(/Aberta → Em atendimento/)).toBeInTheDocument()
    expect(corpos).toEqual([{ status: 'EM_ATENDIMENTO' }])
  })

  describe('anexos', () => {
    // jsdom não implementa createObjectURL/revokeObjectURL: são definidos só
    // no teste de download e restaurados aqui.
    const urlOriginal = { criar: URL.createObjectURL, revogar: URL.revokeObjectURL }
    afterEach(() => {
      URL.createObjectURL = urlOriginal.criar
      URL.revokeObjectURL = urlOriginal.revogar
    })

    it('baixa o anexo como blob e revoga o object URL depois do clique', async () => {
      const user = userEvent.setup()
      const criar = vi.fn(() => 'blob:anexo-1')
      const revogar = vi.fn()
      URL.createObjectURL = criar
      URL.revokeObjectURL = revogar
      const clique = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
      renderDetalhe(OCORRENCIA_ENCERRADA_ID, ['Administrador'])

      await user.click(await screen.findByRole('button', { name: 'Baixar Foto do animal.jpg' }))

      await waitFor(() => expect(revogar).toHaveBeenCalledWith('blob:anexo-1'))
      expect(criar).toHaveBeenCalledTimes(1)
      expect(clique).toHaveBeenCalledTimes(1)
    })

    it('mostra a mensagem genérica "Anexo restrito" quando o download é negado (403)', async () => {
      const user = userEvent.setup()
      server.use(
        http.get(`${API_BASE_URL}/ocorrencias/${OCORRENCIA_ENCERRADA_ID}/anexos/${ANEXO_ENCERRADA_ID}`, () =>
          HttpResponse.json({ mensagem: 'Acesso negado' }, { status: 403 }),
        ),
      )
      renderDetalhe(OCORRENCIA_ENCERRADA_ID, ['Administrador'])

      await user.click(await screen.findByRole('button', { name: 'Baixar Foto do animal.jpg' }))

      expect(await screen.findByRole('alert')).toHaveTextContent('Anexo restrito')
    })

    it('mostra o cadeado e nenhum botão de download em sigilosa sem permissão (podeVerDenunciante=false)', async () => {
      renderDetalhe(OCORRENCIA_SIGILOSA_ID, ['Veterinário'])

      expect(await screen.findByText('Foto do quintal.jpg')).toBeInTheDocument()
      expect(screen.getByLabelText('restrito')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Baixar Foto do quintal.jpg' })).not.toBeInTheDocument()
    })

    it('libera o download em sigilosa com permissão (podeVerDenunciante=true)', async () => {
      server.use(http.get(`${API_BASE_URL}/ocorrencias/${OCORRENCIA_SIGILOSA_ID}`, () => HttpResponse.json(ocorrenciaSigilosaVisivel())))
      renderDetalhe(OCORRENCIA_SIGILOSA_ID, ['Administrador'])

      expect(await screen.findByRole('button', { name: 'Baixar Foto do quintal.jpg' })).toBeInTheDocument()
      expect(screen.queryByLabelText('restrito')).not.toBeInTheDocument()
    })
  })

  it('mostra erro e o link de volta quando a ocorrência não existe (404)', async () => {
    renderDetalhe('h5000000-0000-0000-0000-00000000dead', ['Administrador'])

    expect(await screen.findByText('Não foi possível carregar esta ocorrência.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Voltar para Ocorrências/ })).toHaveAttribute('href', '/ocorrencias')
  })
})
