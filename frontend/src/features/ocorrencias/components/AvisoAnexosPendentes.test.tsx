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
import { ANEXO_CRIADO_FIXTURE, OCORRENCIA_ABERTA_ID, OCORRENCIA_ENCERRADA_ID } from '@/mocks/ocorrenciasFixtures'
import { CadastrarOcorrencia } from './CadastrarOcorrencia'
import { OcorrenciaDetalhe } from './OcorrenciaDetalhe'

// jsdom não implementa IndexedDB: a pendência gravada numa sessão anterior
// (D15) é simulada mockando o storage — mesmo padrão de
// OcorrenciaForm.autosave.test.tsx.
vi.mock('../storage/rascunhoOcorrenciaStorage', async () => {
  const real =
    await vi.importActual<typeof import('../storage/rascunhoOcorrenciaStorage')>('../storage/rascunhoOcorrenciaStorage')
  return {
    ...real,
    carregarRascunhoOcorrencia: vi.fn().mockResolvedValue(null),
    carregarAnexosPendentes: vi.fn(),
    salvarAnexosPendentes: vi.fn().mockResolvedValue(undefined),
    removerAnexosPendentes: vi.fn().mockResolvedValue(undefined),
  }
})

import { carregarAnexosPendentes, removerAnexosPendentes } from '../storage/rascunhoOcorrenciaStorage'

const PENDENCIA = {
  ocorrenciaId: OCORRENCIA_ABERTA_ID,
  protocolo: '089/2026',
  anexos: [new File(['b'], 'b.png', { type: 'image/png' })],
}

function renderEm(rota: string) {
  const usuario: Usuario = {
    id: 'a1b2c3d4-0000-0000-0000-000000000002',
    nome: 'Rafael',
    sobrenome: 'Santos',
    email: 'rafael.santos@itu.sp.gov.br',
    cargos: ['Agente Sanitário'],
    senhaAlteradaEm: '2026-01-10T12:00:00Z',
  }
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ token: 'token-existente', usuario }))

  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[rota]}>
        <AuthProvider>
          <Routes>
            <Route path="/ocorrencias/novo" element={<CadastrarOcorrencia />} />
            <Route path="/ocorrencias/:id" element={<OcorrenciaDetalhe />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('aviso de anexos pendentes (D15)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(carregarAnexosPendentes).mockResolvedValue(PENDENCIA)
  })

  it('no cadastro: mostra o aviso com o protocolo e bloqueia um novo registro', async () => {
    renderEm('/ocorrencias/novo')

    expect(await screen.findByText(/Há anexos pendentes da ocorrência OC 089\/2026/)).toBeInTheDocument()
    expect(screen.getByText('b.png')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Registrar Ocorrência' })).toBeDisabled()
  })

  it('no cadastro: "Descartar" remove a pendência e libera o registro', async () => {
    const user = userEvent.setup()
    renderEm('/ocorrencias/novo')

    await user.click(await screen.findByRole('button', { name: 'Descartar' }))

    expect(removerAnexosPendentes).toHaveBeenCalledTimes(1)
    expect(screen.queryByText(/Há anexos pendentes/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Registrar Ocorrência' })).toBeEnabled()
  })

  it('no detalhe da ocorrência dona dos anexos: mostra o aviso e "Reenviar" sobe só o pendente', async () => {
    const user = userEvent.setup()
    let uploads = 0
    server.use(
      http.post(`${API_BASE_URL}/ocorrencias/${OCORRENCIA_ABERTA_ID}/anexos`, () => {
        uploads += 1
        return HttpResponse.json(ANEXO_CRIADO_FIXTURE, { status: 201 })
      }),
    )
    renderEm(`/ocorrencias/${OCORRENCIA_ABERTA_ID}`)

    await user.click(await screen.findByRole('button', { name: 'Reenviar' }))

    await waitFor(() => expect(screen.queryByText(/Há anexos pendentes/)).not.toBeInTheDocument())
    expect(uploads).toBe(1)
    expect(removerAnexosPendentes).toHaveBeenCalledTimes(1)
  })

  it('no detalhe de outra ocorrência: não mostra o aviso', async () => {
    renderEm(`/ocorrencias/${OCORRENCIA_ENCERRADA_ID}`)

    await screen.findByRole('heading', { name: 'Ocorrência OC 070/2026', level: 1 })
    expect(screen.queryByText(/Há anexos pendentes/)).not.toBeInTheDocument()
  })
})
