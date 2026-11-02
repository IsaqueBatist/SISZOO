import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider, definirSessaoEmMemoria } from '@/features/auth/hooks/AuthContext'
import type { Usuario } from '@/features/auth/types/auth.types'
import { CadastrarOcorrencia } from './CadastrarOcorrencia'

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

import type { RegistroRascunho } from '@/lib/rascunhoDb'
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
  definirSessaoEmMemoria({ token: 'token-existente', usuario })

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
    let resolverCarregamento: (valor: RegistroRascunho<unknown> | null) => void = () => {}
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

  it('agenda salvar com exatamente as 14 chaves de OcorrenciaFormValues', async () => {
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
        'urgente',
        'sigilosa',
        'anonima',
        'denunciante',
        'denunciadoAtivo',
        'denunciado',
        'anexos',
      ].sort(),
    )
  })

  it('persiste os dados do denunciante no rascunho mesmo com a ocorrência sigilosa', async () => {
    vi.mocked(carregarRascunhoOcorrencia).mockResolvedValue(null)

    const user = userEvent.setup()
    renderForm()

    await user.type(screen.getByLabelText(/Nome completo/i), 'Fulano de Tal')
    await user.click(screen.getByLabelText('Ocorrência sigilosa'))
    await user.type(screen.getByLabelText(/^Bairro/i), 'Bairro Teste')

    await waitFor(() => expect(agendarSalvarRascunhoOcorrencia).toHaveBeenCalled())
    const chamadas = vi.mocked(agendarSalvarRascunhoOcorrencia).mock.calls
    const ultimaComSigilo = chamadas
      .map(([valores]) => valores as { sigilosa: boolean; denunciante: { nome: string } })
      .findLast((valores) => valores.sigilosa)
    expect(ultimaComSigilo?.denunciante.nome).toBe('Fulano de Tal')
  })

  it('denúncia anônima continua sem dados do denunciante no rascunho', async () => {
    vi.mocked(carregarRascunhoOcorrencia).mockResolvedValue(null)

    const user = userEvent.setup()
    renderForm()

    await user.type(screen.getByLabelText(/Nome completo/i), 'Fulano de Tal')
    await user.click(screen.getByLabelText('Denunciante anônimo'))
    await user.type(screen.getByLabelText(/^Bairro/i), 'Bairro Teste')

    await waitFor(() => expect(agendarSalvarRascunhoOcorrencia).toHaveBeenCalled())
    const chamadas = vi.mocked(agendarSalvarRascunhoOcorrencia).mock.calls
    const ultimaAnonima = chamadas
      .map(([valores]) => valores as { anonima: boolean; denunciante: Record<string, string> })
      .findLast((valores) => valores.anonima)
    expect(ultimaAnonima).toBeDefined()
    expect(Object.values(ultimaAnonima!.denunciante).every((valor) => valor === '')).toBe(true)
  })

  it('o aviso de restauração mostra quando o rascunho foi salvo', async () => {
    vi.mocked(carregarRascunhoOcorrencia).mockResolvedValue({
      salvoEm: new Date('2026-10-24T22:42:00Z').getTime(),
      dados: { bairro: 'Centro', anexos: [] },
    })

    renderForm()

    expect(await screen.findByText('Salvo em 24/10/2026, 19:42.')).toBeInTheDocument()
  })
})
