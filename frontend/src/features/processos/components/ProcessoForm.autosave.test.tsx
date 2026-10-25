import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider, SESSION_STORAGE_KEY } from '@/features/auth/hooks/AuthContext'
import type { Usuario } from '@/features/auth/types/auth.types'
import { CadastrarProcesso } from './CadastrarProcesso'

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

const USUARIO_ID = 'a1b2c3d4-0000-0000-0000-000000000099'

function autenticar(cargos = ['Administrador']) {
  const usuario: Usuario = {
    id: USUARIO_ID,
    nome: 'Ana',
    sobrenome: 'Silva',
    email: 'ana.silva@itu.sp.gov.br',
    cargos,
    senhaAlteradaEm: '2026-01-10T12:00:00Z',
  }
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ token: 'token-existente', usuario }))
}

function renderCadastrar(cargos?: string[]) {
  autenticar(cargos)
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
  })

  it('não agenda salvar o rascunho antes da checagem inicial terminar', async () => {
    let resolverCarregamento: (valor: unknown) => void = () => {}
    vi.mocked(carregarRascunhoProcesso).mockImplementation(
      () => new Promise((resolve) => { resolverCarregamento = resolve as (valor: unknown) => void }),
    )

    const user = userEvent.setup()
    renderCadastrar()

    await user.selectOptions(screen.getByLabelText(/Tipo de doença investigada/i), await screen.findByRole('option', { name: 'Raiva' }))
    expect(agendarSalvarRascunhoProcesso).not.toHaveBeenCalled()

    await act(async () => {
      resolverCarregamento(null)
    })

    await user.selectOptions(screen.getByLabelText(/Laboratório de destino/i), screen.getByRole('option', { name: 'Pasteur — SP' }))
    await waitFor(() => expect(agendarSalvarRascunhoProcesso).toHaveBeenCalled())
  })

  it('salva o rascunho (sem debounce) a cada troca de etapa', async () => {
    vi.mocked(carregarRascunhoProcesso).mockResolvedValue(null)
    const user = userEvent.setup()
    renderCadastrar()

    const pane1 = paneDoStep(/^1\. Dados/)
    await user.click(await pane1.findByRole('button', { name: 'Pular esta etapa' }))
    await user.selectOptions(screen.getByLabelText(/Tipo de doença investigada/i), await screen.findByRole('option', { name: 'Raiva' }))
    await user.selectOptions(screen.getByLabelText(/Laboratório de destino/i), screen.getByRole('option', { name: 'Pasteur — SP' }))
    await user.click(pane1.getByRole('button', { name: 'Continuar →' }))

    await waitFor(() =>
      expect(salvarRascunhoProcesso).toHaveBeenCalledWith(
        `${USUARIO_ID}:novo`,
        expect.objectContaining({ etapaAtual: 2 }),
      ),
    )
  })

  // O autosave com debounce roda a cada tecla depois da troca de etapa: se ele
  // gravasse a etapa de quando a assinatura nasceu, o próximo campo digitado
  // desfaria o salvamento da troca e o rascunho reabriria na etapa 1.
  it('o autosave depois de trocar de etapa grava a etapa atual, não a de quando começou', async () => {
    vi.mocked(carregarRascunhoProcesso).mockResolvedValue(null)
    const user = userEvent.setup()
    renderCadastrar()

    const pane1 = paneDoStep(/^1\. Dados/)
    await user.click(await pane1.findByRole('button', { name: 'Pular esta etapa' }))
    await user.selectOptions(screen.getByLabelText(/Tipo de doença investigada/i), await screen.findByRole('option', { name: 'Raiva' }))
    await user.selectOptions(screen.getByLabelText(/Laboratório de destino/i), screen.getByRole('option', { name: 'Pasteur — SP' }))
    await user.click(pane1.getByRole('button', { name: 'Continuar →' }))
    await waitFor(() => expect(screen.getByText('Responsável').closest('.step')).toHaveClass('active'))

    vi.mocked(agendarSalvarRascunhoProcesso).mockClear()
    await user.type(screen.getByLabelText(/^Nome/i), 'Maria')

    await waitFor(() => expect(agendarSalvarRascunhoProcesso).toHaveBeenCalled())
    expect(vi.mocked(agendarSalvarRascunhoProcesso).mock.calls.at(-1)?.[1]).toMatchObject({ etapaAtual: 2 })
  })

  function rascunhoComVinculo() {
    return {
      // T42: o instante do salvamento acompanha o rascunho, para o aviso dizer
      // de quando ele é.
      salvoEm: Date.now(),
      etapaAtual: 3 as const,
      valores: {
        vinculoDecisao: 'vinculado' as const,
        ocorrenciaId: 'h5000000-0000-0000-0000-000000000001',
        ocorrenciaResumo: {
          id: 'h5000000-0000-0000-0000-000000000001',
          protocolo: '089/2026',
          tipoOcorrenciaNome: 'Suspeita de Zoonose',
          bairro: 'Vila Esperança',
        },
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
            origem: 'externo' as const,
            especie: 'canino',
            sexo: 'macho' as const,
            raca: '',
            coloracao: '',
            pelagem: '' as const,
            idadeAprox: '',
            pesoKg: undefined,
            statusClinico: 'ASSINTOMATICO' as const,
            tipoAbrigo: 'INTRADOMICILIAR' as const,
            alteracaoComportamental: '',
            dataColeta: '2026-05-20',
            materialBiologico: 'SORO' as const,
            contatoHumano: false,
            observacoes: '',
            sintomas: [],
          },
        ],
        observacoes: '',
      },
    }
  }

  it('o rascunho restaurado reabre na etapa salva com o vínculo travado, sem buscar a ocorrência de novo', async () => {
    vi.mocked(carregarRascunhoProcesso).mockResolvedValue(rascunhoComVinculo())
    const user = userEvent.setup()
    renderCadastrar()

    await user.click(await screen.findByRole('button', { name: 'Restaurar rascunho' }))

    expect(screen.getByText('Amostras').closest('.step')).toHaveClass('active')
    const vinculo = screen.getByTestId('vinculo-travado')
    expect(within(vinculo).getByText(/OC 089\/2026/)).toBeInTheDocument()
  })

  it('Veterinário que restaura rascunho com vínculo volta à etapa 1 sem o vínculo (D33)', async () => {
    vi.mocked(carregarRascunhoProcesso).mockResolvedValue(rascunhoComVinculo())
    const user = userEvent.setup()
    renderCadastrar(['Veterinário'])

    await user.click(await screen.findByRole('button', { name: 'Restaurar rascunho' }))

    expect(screen.getByText('Vínculo').closest('.step')).toHaveClass('active')
    expect(screen.queryByTestId('vinculo-travado')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Continuar sem vínculo' })).toBeInTheDocument()
    expect(screen.getByLabelText(/^Nome/i)).toHaveValue('Maria Responsável')
  })
})
