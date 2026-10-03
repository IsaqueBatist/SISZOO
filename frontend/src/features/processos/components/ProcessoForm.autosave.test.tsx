import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider, SESSION_STORAGE_KEY } from '@/features/auth/hooks/AuthContext'
import type { Usuario } from '@/features/auth/types/auth.types'
import { resetOcorrenciasMock } from '@/features/ocorrencias/api/ocorrenciasMockStore'
import { CadastrarProcesso } from './CadastrarProcesso'
import { resetProcessosMock } from '../api/processosMockStore'

// jsdom não implementa IndexedDB — mesmo padrão de
// AnimalForm.autosave.test.tsx / OcorrenciaForm.autosave.test.tsx: mocka o
// módulo de storage para testar QUANDO ele é chamado (gate de hidratação,
// troca de etapa), não a mecânica de IndexedDB em si.
vi.mock('../storage/rascunhoProcessoStorage', async () => {
  const real = await vi.importActual<typeof import('../storage/rascunhoProcessoStorage')>('../storage/rascunhoProcessoStorage')
  return {
    ...real,
    carregarRascunhoProcesso: vi.fn(),
    agendarSalvarRascunhoProcesso: vi.fn(),
    salvarRascunhoProcesso: vi.fn().mockResolvedValue(undefined),
    removerRascunhoProcesso: vi.fn().mockResolvedValue(undefined),
  }
})

import { agendarSalvarRascunhoProcesso, carregarRascunhoProcesso, salvarRascunhoProcesso } from '../storage/rascunhoProcessoStorage'

function autenticar() {
  const usuario: Usuario = {
    id: 'a1b2c3d4-0000-0000-0000-000000000099',
    nome: 'Ana',
    sobrenome: 'Silva',
    email: 'ana.silva@itu.sp.gov.br',
    cargos: ['Administrador'],
    senhaAlteradaEm: '2026-01-10T12:00:00Z',
  }
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ token: 'token-existente', usuario }))
}

function renderCadastrar() {
  autenticar()
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/processos/novo']}>
        <AuthProvider>
          <Routes>
            <Route path="/ocorrencias" element={<div>Lista de ocorrências</div>} />
            <Route path="/processos/novo" element={<CadastrarProcesso />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function paneDoStep(regex: RegExp) {
  return within(screen.getByText(regex).closest('.card') as HTMLElement)
}

describe('ProcessoForm — autosave do rascunho', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetOcorrenciasMock()
    resetProcessosMock()
  })

  it('não agenda salvar o rascunho antes da checagem inicial terminar', async () => {
    let resolverCarregamento: (valor: unknown) => void = () => {}
    vi.mocked(carregarRascunhoProcesso).mockImplementation(
      () => new Promise((resolve) => { resolverCarregamento = resolve as (valor: unknown) => void }),
    )

    const user = userEvent.setup()
    renderCadastrar()

    await user.selectOptions(screen.getByLabelText(/Tipo de doença investigada/i), 'raiva')
    expect(agendarSalvarRascunhoProcesso).not.toHaveBeenCalled()

    await act(async () => {
      resolverCarregamento(null)
    })

    await user.selectOptions(screen.getByLabelText(/Laboratório de destino/i), 'pasteur_sp')
    await waitFor(() => expect(agendarSalvarRascunhoProcesso).toHaveBeenCalled())
  })

  it('salva o rascunho (sem debounce) a cada troca de etapa', async () => {
    vi.mocked(carregarRascunhoProcesso).mockResolvedValue(null)
    const user = userEvent.setup()
    renderCadastrar()

    const pane1 = paneDoStep(/^1\. Dados/)
    await user.click(pane1.getByRole('button', { name: 'Pular esta etapa' }))
    await user.selectOptions(screen.getByLabelText(/Tipo de doença investigada/i), 'raiva')
    await user.selectOptions(screen.getByLabelText(/Laboratório de destino/i), 'pasteur_sp')
    await user.click(pane1.getByRole('button', { name: 'Continuar →' }))

    await waitFor(() =>
      expect(salvarRascunhoProcesso).toHaveBeenCalledWith(expect.objectContaining({ etapaAtual: 2 })),
    )
  })

  it('o rascunho restaurado reabre na etapa salva com o vínculo travado', async () => {
    vi.mocked(carregarRascunhoProcesso).mockResolvedValue({
      etapaAtual: 3,
      valores: {
        vinculoDecisao: 'vinculado',
        ocorrenciaId: 'h5000000-0000-0000-0000-000000000001',
        dataAbertura: '2026-05-20',
        doenca: 'raiva',
        laboratorio: 'pasteur_sp',
        responsavel: {
          nome: 'Maria Responsável',
          cpf: '',
          telefone: '',
          email: '',
          cep: '',
          endereco: '',
          bairroResidencial: '',
          bairroOcorrencia: '',
        },
        amostras: [
          {
            origem: 'externo',
            especieId: 'canino',
            sexo: 'macho',
            raca: '',
            coloracao: '',
            pelagem: '',
            idadeAprox: '',
            pesoKg: undefined,
            statusClinico: 'assintomatico',
            tipoAbrigo: 'intradomiciliar',
            alteracaoComportamental: '',
            dataColeta: '2026-05-20',
            materialBiologico: 'soro',
            contatoHumano: false,
            observacoes: '',
            sintomas: [],
          },
        ],
        observacoes: '',
      },
    })

    const user = userEvent.setup()
    renderCadastrar()

    await user.click(await screen.findByRole('button', { name: 'Restaurar rascunho' }))

    expect(screen.getByText('Amostras').closest('.step')).toHaveClass('active')
    const vinculo = screen.getByTestId('vinculo-travado')
    expect(await within(vinculo).findByText(/089\/2026/)).toBeInTheDocument()
  })
})
