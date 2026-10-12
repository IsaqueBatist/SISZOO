import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider, SESSION_STORAGE_KEY } from '@/features/auth/hooks/AuthContext'
import type { Usuario } from '@/features/auth/types/auth.types'
import { API_BASE_URL } from '@/lib/env'
import { server } from '@/mocks/server'
import {
  OCORRENCIA_ABERTA_ID,
  OCORRENCIA_ANONIMA_ID,
  OCORRENCIA_ENCERRADA_ID,
  OCORRENCIA_SIGILOSA_ID,
  criarOcorrenciaFixture,
  ocorrenciaAnonima,
} from '@/mocks/ocorrenciasFixtures'
import type { Ocorrencia } from '../types/ocorrencias.types'
import { EditarOcorrencia } from './EditarOcorrencia'
import { OcorrenciaDetalhe } from './OcorrenciaDetalhe'

// jsdom não implementa IndexedDB: o storage é mockado para conferir a chave
// do rascunho da edição (mesmo padrão de OcorrenciaForm.autosave.test.tsx).
vi.mock('../storage/rascunhoOcorrenciaStorage', async () => {
  const real =
    await vi.importActual<typeof import('../storage/rascunhoOcorrenciaStorage')>('../storage/rascunhoOcorrenciaStorage')
  return {
    ...real,
    carregarRascunhoOcorrencia: vi.fn().mockResolvedValue(null),
    agendarSalvarRascunhoOcorrencia: vi.fn(),
    removerRascunhoOcorrencia: vi.fn().mockResolvedValue(undefined),
    carregarAnexosPendentes: vi.fn().mockResolvedValue(null),
  }
})

import { agendarSalvarRascunhoOcorrencia, removerRascunhoOcorrencia } from '../storage/rascunhoOcorrenciaStorage'

const USUARIO_ID = 'a1b2c3d4-0000-0000-0000-000000000002'

function renderEm(rota: string, cargos: string[] = ['Agente Sanitário']) {
  const usuario: Usuario = {
    id: USUARIO_ID,
    nome: 'Rafael',
    sobrenome: 'Santos',
    email: 'rafael.santos@itu.sp.gov.br',
    cargos,
    senhaAlteradaEm: '2026-01-10T12:00:00Z',
  }
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ token: 'token-existente', usuario }))

  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[rota]}>
        <AuthProvider>
          <Routes>
            <Route path="/ocorrencias/:id/editar" element={<EditarOcorrencia />} />
            <Route path="/ocorrencias/:id" element={<OcorrenciaDetalhe />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

// Serve `ocorrencia` no GET e registra o corpo de cada PUT.
function servirParaEdicao(ocorrencia: Ocorrencia) {
  const corpos: Record<string, unknown>[] = []
  server.use(
    http.get(`${API_BASE_URL}/ocorrencias/${ocorrencia.id}`, () => HttpResponse.json(ocorrencia)),
    http.put(`${API_BASE_URL}/ocorrencias/${ocorrencia.id}`, async ({ request }) => {
      corpos.push((await request.json()) as Record<string, unknown>)
      return HttpResponse.json(ocorrencia)
    }),
  )
  return corpos
}

async function salvar(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Salvar alterações' }))
}

describe('EditarOcorrencia', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('carrega os dados da ocorrência no formulário', async () => {
    renderEm(`/ocorrencias/${OCORRENCIA_ABERTA_ID}/editar`)

    expect(await screen.findByRole('heading', { name: 'Editar Ocorrência' })).toBeInTheDocument()
    expect(screen.getByText('OC 089/2026')).toBeInTheDocument()
    expect(screen.getByLabelText(/Endereço da ocorrência/i)).toHaveValue('Rua das Acácias, 145')
    expect(screen.getByLabelText('Hora aproximada')).toHaveValue('10:32')
    expect(screen.getByLabelText(/Nome completo/i)).toHaveValue('Maria Souza Oliveira')
    expect(screen.queryByText('5. Anexos')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Denunciante anônimo')).not.toBeInTheDocument()
  })

  it('PUT sem mudança nos blocos: manda as flags e omite denunciante e denunciado (D10)', async () => {
    const user = userEvent.setup()
    const corpos = servirParaEdicao(criarOcorrenciaFixture())
    renderEm(`/ocorrencias/${OCORRENCIA_ABERTA_ID}/editar`)

    const endereco = await screen.findByLabelText(/Endereço da ocorrência/i)
    await user.clear(endereco)
    await user.type(endereco, 'Rua Nova, 1')
    await user.click(screen.getByLabelText('Urgente (contato humano-animal)'))
    await salvar(user)

    await screen.findByRole('heading', { name: 'Ocorrência OC 089/2026', level: 1 })
    expect(corpos).toHaveLength(1)
    expect(corpos[0]).toMatchObject({ endereco: 'Rua Nova, 1', urgente: true, sigilosa: false, anonima: false })
    expect(corpos[0]).not.toHaveProperty('denunciante')
    expect(corpos[0]).not.toHaveProperty('denunciado')
    expect(removerRascunhoOcorrencia).toHaveBeenCalledWith(`${USUARIO_ID}:editar:${OCORRENCIA_ABERTA_ID}`)
  })

  it('PUT com o denunciante alterado: manda o bloco inteiro, e só ele', async () => {
    const user = userEvent.setup()
    const corpos = servirParaEdicao(criarOcorrenciaFixture())
    renderEm(`/ocorrencias/${OCORRENCIA_ABERTA_ID}/editar`)

    const telefone = await screen.findByLabelText('Telefone')
    await user.clear(telefone)
    await user.type(telefone, '(11) 9 0000-1111')
    await salvar(user)

    await waitFor(() => expect(corpos).toHaveLength(1))
    expect(corpos[0].denunciante).toEqual({
      nome: 'Maria Souza Oliveira',
      cpf: '123.456.789-00',
      telefone: '(11) 9 0000-1111',
      email: 'maria.souza@email.com',
      cep: '13301-000',
      endereco: 'Rua dos Ipês, 220',
      bairroResidencial: 'Vila Esperança',
    })
    expect(corpos[0]).not.toHaveProperty('denunciado')
  })

  it('desligar "existe denunciado" manda o bloco vazio, que limpa os dados', async () => {
    const user = userEvent.setup()
    const corpos = servirParaEdicao(
      criarOcorrenciaFixture({
        denunciado: { nome: 'Vizinho', cpf: null, telefone: null, endereco: 'Rua X, 2', observacoes: null },
      }),
    )
    renderEm(`/ocorrencias/${OCORRENCIA_ABERTA_ID}/editar`)

    await user.click(await screen.findByLabelText('Existe denunciado identificado'))
    await salvar(user)

    await waitFor(() => expect(corpos).toHaveLength(1))
    expect(corpos[0].denunciado).toEqual({})
    expect(corpos[0]).not.toHaveProperty('denunciante')
  })

  it('sigilosa sem permissão (podeVerDenunciante=false): bloco "Sigiloso", toggle travado e denunciante nunca enviado', async () => {
    const user = userEvent.setup()
    const corpos = servirParaEdicao(
      criarOcorrenciaFixture({
        id: OCORRENCIA_SIGILOSA_ID,
        sigilosa: true,
        podeVerDenunciante: false,
        denunciante: { nome: null, cpf: null, telefone: null, email: null, cep: null, endereco: null, bairroResidencial: null },
      }),
    )
    renderEm(`/ocorrencias/${OCORRENCIA_SIGILOSA_ID}/editar`)

    expect(await screen.findByText(/^Sigiloso: os dados do denunciante/)).toBeInTheDocument()
    expect(screen.queryByLabelText(/Nome completo/i)).not.toBeInTheDocument()
    expect(screen.getByLabelText('Ocorrência sigilosa')).toBeDisabled()

    await user.type(screen.getByLabelText(/^Bairro/i), ' 2')
    await salvar(user)

    await waitFor(() => expect(corpos).toHaveLength(1))
    expect(corpos[0]).toMatchObject({ sigilosa: true, anonima: false })
    expect(corpos[0]).not.toHaveProperty('denunciante')
  })

  it('sigilosa com permissão: o toggle de sigilo fica liberado', async () => {
    servirParaEdicao(criarOcorrenciaFixture({ id: OCORRENCIA_SIGILOSA_ID, sigilosa: true, podeVerDenunciante: true }))
    renderEm(`/ocorrencias/${OCORRENCIA_SIGILOSA_ID}/editar`)

    expect(await screen.findByLabelText('Ocorrência sigilosa')).toBeEnabled()
  })

  it('"Identificar denunciante" numa anônima: mostra o bloco e manda anonima=false com os dados (D32)', async () => {
    const user = userEvent.setup()
    const corpos = servirParaEdicao(ocorrenciaAnonima())
    renderEm(`/ocorrencias/${OCORRENCIA_ANONIMA_ID}/editar`)

    expect(await screen.findByText('Denúncia anônima: nenhum dado do denunciante é registrado.')).toBeInTheDocument()
    expect(screen.queryByLabelText(/Nome completo/i)).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Identificar denunciante' }))
    await user.type(screen.getByLabelText(/Nome completo/i), 'Fulano de Tal')
    await salvar(user)

    await waitFor(() => expect(corpos).toHaveLength(1))
    expect(corpos[0]).toMatchObject({ anonima: false, denunciante: { nome: 'Fulano de Tal' } })
  })

  it('"Identificar denunciante" não aparece sem a permissão de sigilo (podeVerDenunciante=false)', async () => {
    servirParaEdicao({ ...ocorrenciaAnonima(), podeVerDenunciante: false })
    renderEm(`/ocorrencias/${OCORRENCIA_ANONIMA_ID}/editar`)

    await screen.findByText('Denúncia anônima: nenhum dado do denunciante é registrado.')
    expect(screen.queryByRole('button', { name: 'Identificar denunciante' })).not.toBeInTheDocument()
  })

  it('mostra a mensagem do backend quando a urgência é definida pelo processo (422)', async () => {
    const user = userEvent.setup()
    servirParaEdicao(criarOcorrenciaFixture({ urgente: true }))
    server.use(
      http.put(`${API_BASE_URL}/ocorrencias/${OCORRENCIA_ABERTA_ID}`, () =>
        HttpResponse.json({ mensagem: 'Urgencia definida pelo processo sanitario vinculado' }, { status: 422 }),
      ),
    )
    renderEm(`/ocorrencias/${OCORRENCIA_ABERTA_ID}/editar`)

    await user.click(await screen.findByLabelText('Urgente (contato humano-animal)'))
    await salvar(user)

    expect(await screen.findByText('Urgencia definida pelo processo sanitario vinculado')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Editar Ocorrência' })).toBeInTheDocument()
  })

  it('salva o rascunho da edição na chave da própria ocorrência', async () => {
    const user = userEvent.setup()
    renderEm(`/ocorrencias/${OCORRENCIA_ABERTA_ID}/editar`)

    await user.type(await screen.findByLabelText(/^Bairro/i), ' 2')

    await waitFor(() => expect(agendarSalvarRascunhoOcorrencia).toHaveBeenCalled())
    expect(vi.mocked(agendarSalvarRascunhoOcorrencia).mock.calls.at(-1)?.[1]).toBe(`${USUARIO_ID}:editar:${OCORRENCIA_ABERTA_ID}`)
  })

  it('acesso direto à edição de uma ocorrência encerrada redireciona para o detalhe', async () => {
    renderEm(`/ocorrencias/${OCORRENCIA_ENCERRADA_ID}/editar`)

    expect(await screen.findByRole('heading', { name: 'Ocorrência OC 070/2026', level: 1 })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Editar Ocorrência' })).not.toBeInTheDocument()
  })

  describe('botão "Editar" no detalhe', () => {
    it('aparece para Agente numa ocorrência não encerrada e leva à edição', async () => {
      renderEm(`/ocorrencias/${OCORRENCIA_ABERTA_ID}`)

      const link = await screen.findByRole('link', { name: /Editar/ })
      expect(link).toHaveAttribute('href', `/ocorrencias/${OCORRENCIA_ABERTA_ID}/editar`)
    })

    it('não aparece numa ocorrência encerrada', async () => {
      renderEm(`/ocorrencias/${OCORRENCIA_ENCERRADA_ID}`)

      await screen.findByRole('heading', { name: 'Ocorrência OC 070/2026', level: 1 })
      expect(screen.queryByRole('link', { name: /Editar/ })).not.toBeInTheDocument()
    })

    it('não aparece para o perfil Veterinário', async () => {
      renderEm(`/ocorrencias/${OCORRENCIA_ABERTA_ID}`, ['Veterinário'])

      await screen.findByRole('heading', { name: 'Ocorrência OC 089/2026', level: 1 })
      expect(screen.queryByRole('link', { name: /Editar/ })).not.toBeInTheDocument()
    })
  })
})
