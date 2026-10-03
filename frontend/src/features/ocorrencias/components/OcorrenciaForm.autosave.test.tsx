import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider, SESSION_STORAGE_KEY } from '@/features/auth/hooks/AuthContext'
import type { Usuario } from '@/features/auth/types/auth.types'
import { CadastrarOcorrencia } from './CadastrarOcorrencia'

// jsdom não implementa IndexedDB, então o módulo de rascunho é mockado
// diretamente — mesmo padrão de AnimalForm.autosave.test.tsx. Testa QUANDO
// agendarSalvarRascunhoOcorrencia é chamado (gate de hidratação) e COM QUE
// FORMA (campos do denunciante redigidos quando sigilosa), não a mecânica de
// IndexedDB em si (responsabilidade de rascunhoOcorrenciaStorage.ts,
// inalterada aqui).
vi.mock('../storage/rascunhoOcorrenciaStorage', async () => {
  const real =
    await vi.importActual<typeof import('../storage/rascunhoOcorrenciaStorage')>('../storage/rascunhoOcorrenciaStorage')
  return {
    ...real,
    carregarRascunhoOcorrencia: vi.fn(),
    agendarSalvarRascunhoOcorrencia: vi.fn(),
    salvarRascunhoOcorrencia: vi.fn().mockResolvedValue(undefined),
    removerRascunhoOcorrencia: vi.fn().mockResolvedValue(undefined),
  }
})

import { agendarSalvarRascunhoOcorrencia, carregarRascunhoOcorrencia } from '../storage/rascunhoOcorrenciaStorage'

function renderForm() {
  const usuario: Usuario = {
    id: 'a1b2c3d4-0000-0000-0000-000000000001',
    nome: 'Stéphanie',
    sobrenome: 'Lima',
    email: 'stephanie.lima@itu.sp.gov.br',
    cargos: ['Administrador'],
    senhaAlteradaEm: '2026-01-10T12:00:00Z',
  }
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ token: 'token-existente', usuario }))

  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/ocorrencias/novo']}>
        <AuthProvider>
          <Routes>
            <Route path="/ocorrencias" element={<div>Lista de ocorrências</div>} />
            <Route path="/ocorrencias/novo" element={<CadastrarOcorrencia />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('OcorrenciaForm — autosave do rascunho', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('não agenda salvar o rascunho antes da checagem inicial terminar', async () => {
    let resolverCarregamento: (valor: unknown) => void = () => {}
    vi.mocked(carregarRascunhoOcorrencia).mockImplementation(
      () => new Promise((resolve) => { resolverCarregamento = resolve }),
    )

    const user = userEvent.setup()
    renderForm()

    await user.type(screen.getByLabelText(/^Bairro/i), 'Bairro Teste')
    expect(agendarSalvarRascunhoOcorrencia).not.toHaveBeenCalled()

    await act(async () => {
      resolverCarregamento(null)
    })

    await user.type(screen.getByLabelText(/^Bairro/i), ' 2')
    await waitFor(() => expect(agendarSalvarRascunhoOcorrencia).toHaveBeenCalled())
  })

  it('agenda salvar com exatamente as 11 chaves de OcorrenciaFormValues', async () => {
    vi.mocked(carregarRascunhoOcorrencia).mockResolvedValue(null)

    const user = userEvent.setup()
    renderForm()

    await user.type(screen.getByLabelText(/^Bairro/i), 'Bairro Teste')

    await waitFor(() => expect(agendarSalvarRascunhoOcorrencia).toHaveBeenCalled())
    const [valoresSalvos] = vi.mocked(agendarSalvarRascunhoOcorrencia).mock.calls.at(-1)!
    expect(Object.keys(valoresSalvos as object).sort()).toEqual(
      [
        'tipoOcorrencia',
        'dataAbertura',
        'horaAbertura',
        'endereco',
        'bairro',
        'pontoReferencia',
        'descricao',
        'sigilosa',
        'denunciante',
        'denunciadoAtivo',
        'denunciado',
        'anexos',
      ].sort(),
    )
  })

  it('não persiste os dados do denunciante no rascunho quando a ocorrência é sigilosa (LGPD)', async () => {
    vi.mocked(carregarRascunhoOcorrencia).mockResolvedValue(null)

    const user = userEvent.setup()
    renderForm()

    await user.type(screen.getByLabelText(/Nome completo/i), 'Fulano de Tal')
    await user.click(screen.getByLabelText('Ocorrência sigilosa'))
    // Dispara mais um evento de campo para garantir uma chamada de autosave
    // já com `sigilosa: true` no estado do formulário.
    await user.type(screen.getByLabelText(/^Bairro/i), 'Bairro Teste')

    await waitFor(() => expect(agendarSalvarRascunhoOcorrencia).toHaveBeenCalled())
    const chamadas = vi.mocked(agendarSalvarRascunhoOcorrencia).mock.calls
    const ultimaComSigilo = chamadas.map(([valores]) => valores as { sigilosa: boolean; denunciante: { nome: string } }).findLast(
      (valores) => valores.sigilosa,
    )
    expect(ultimaComSigilo?.denunciante.nome).toBe('')
  })
})
