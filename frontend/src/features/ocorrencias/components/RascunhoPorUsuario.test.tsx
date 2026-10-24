import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'
import { AuthProvider, SESSION_STORAGE_KEY } from '@/features/auth/hooks/AuthContext'
import type { Usuario } from '@/features/auth/types/auth.types'
import { salvarRascunho } from '@/lib/rascunhoDb'
import { OCORRENCIA_ABERTA_ID } from '@/mocks/ocorrenciasFixtures'
import { instalarIndexedDbEmMemoria } from '@/test/indexedDbEmMemoria'
import { CadastrarOcorrencia } from './CadastrarOcorrencia'
import {
  chaveRascunhoOcorrencia,
  salvarAnexosPendentes,
  salvarRascunhoOcorrencia,
} from '../storage/rascunhoOcorrenciaStorage'

// Sem mock do storage: as chaves passam pelo IndexedDB em memória, como no
// navegador compartilhado do CCZ.
const USUARIO_A = 'a1b2c3d4-0000-0000-0000-00000000000a'
const USUARIO_B = 'a1b2c3d4-0000-0000-0000-00000000000b'

const RASCUNHO = { bairroOcorrencia: 'Bairro do A' }
const PENDENCIA = {
  ocorrenciaId: OCORRENCIA_ABERTA_ID,
  protocolo: '089/2026',
  anexos: [new File(['b'], 'b.png', { type: 'image/png' })],
}

function renderCadastroComo(usuarioId: string) {
  const usuario: Usuario = {
    id: usuarioId,
    nome: 'Rafael',
    sobrenome: 'Santos',
    email: 'rafael.santos@itu.sp.gov.br',
    cargos: ['Agente Sanitário'],
    senhaAlteradaEm: '2026-01-10T12:00:00Z',
  }
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ token: 'token-existente', usuario }))

  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/ocorrencias/novo']}>
        <AuthProvider>
          <Routes>
            <Route path="/ocorrencias/novo" element={<CadastrarOcorrencia />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('rascunho e anexos pendentes têm escopo por usuário', () => {
  // Contador de aberturas do banco: é como os testes esperam pelas leituras do
  // IndexedDB antes de afirmar que o aviso NÃO apareceu. Duas aberturas da
  // preparação (os dois salvamentos) mais duas do componente (rascunho e
  // pendência de anexos).
  let aberturas: MockInstance

  beforeEach(() => {
    instalarIndexedDbEmMemoria()
    aberturas = vi.spyOn(indexedDB, 'open')
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('o dono vê o próprio rascunho e a própria pendência', async () => {
    await salvarRascunhoOcorrencia(RASCUNHO, chaveRascunhoOcorrencia(USUARIO_A, undefined))
    await salvarAnexosPendentes(USUARIO_A, PENDENCIA)

    renderCadastroComo(USUARIO_A)

    expect(await screen.findByText(/Encontramos um rascunho salvo/)).toBeInTheDocument()
    expect(await screen.findByText(/Há anexos pendentes da ocorrência OC 089\/2026/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Registrar Ocorrência' })).toBeDisabled()
  })

  it('outro usuário do mesmo navegador não vê nem é bloqueado pelo rascunho/pendência do primeiro', async () => {
    await salvarRascunhoOcorrencia(RASCUNHO, chaveRascunhoOcorrencia(USUARIO_A, undefined))
    await salvarAnexosPendentes(USUARIO_A, PENDENCIA)

    renderCadastroComo(USUARIO_B)

    const registrar = await screen.findByRole('button', { name: 'Registrar Ocorrência' })
    // Dá tempo para as leituras do IndexedDB terminarem antes de afirmar ausência.
    await waitFor(() => expect(aberturas).toHaveBeenCalledTimes(4))
    expect(screen.queryByText(/Encontramos um rascunho salvo/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Há anexos pendentes/)).not.toBeInTheDocument()
    expect(registrar).toBeEnabled()
  })

  it('rascunho e pendência antigos, sem escopo, são ignorados (sem migração)', async () => {
    await salvarRascunho('ocorrencias', 'novo', RASCUNHO)
    await salvarRascunho('ocorrencias', 'anexos-pendentes', PENDENCIA)

    renderCadastroComo(USUARIO_A)

    const registrar = await screen.findByRole('button', { name: 'Registrar Ocorrência' })
    await waitFor(() => expect(aberturas).toHaveBeenCalledTimes(4))
    expect(screen.queryByText(/Encontramos um rascunho salvo/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Há anexos pendentes/)).not.toBeInTheDocument()
    expect(registrar).toBeEnabled()
  })
})
