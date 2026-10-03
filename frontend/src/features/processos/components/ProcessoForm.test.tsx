import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider, SESSION_STORAGE_KEY } from '@/features/auth/hooks/AuthContext'
import type { Usuario } from '@/features/auth/types/auth.types'
import { resetOcorrenciasMock } from '@/features/ocorrencias/api/ocorrenciasMockStore'
import { CadastrarProcesso } from './CadastrarProcesso'
import type { CriarProcessoRequest, Processo } from '../types/processos.types'
import { resetProcessosMock } from '../api/processosMockStore'

vi.mock('../api/processosApi', async () => {
  const real = await vi.importActual<typeof import('../api/processosApi')>('../api/processosApi')
  return { ...real, criarProcesso: vi.fn() }
})
import { criarProcesso } from '../api/processosApi'

const OCORRENCIA_ABERTA_ID = 'h5000000-0000-0000-0000-000000000001'
const OCORRENCIA_PROCESSO_PENDENTE_ID = 'h5000000-0000-0000-0000-000000000004'

function autenticarComCargos(cargos: string[]) {
  const usuario: Usuario = {
    id: 'a1b2c3d4-0000-0000-0000-000000000099',
    nome: 'Ana',
    sobrenome: 'Silva',
    email: 'ana.silva@itu.sp.gov.br',
    cargos,
    senhaAlteradaEm: '2026-01-10T12:00:00Z',
  }
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ token: 'token-existente', usuario }))
}

function renderCadastrar(initialEntry = '/processos/novo') {
  autenticarComCargos(['Administrador'])
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <AuthProvider>
          <Routes>
            <Route path="/ocorrencias" element={<div>Lista de ocorrências</div>} />
            <Route path="/ocorrencias/:id" element={<div>Detalhe da ocorrência</div>} />
            <Route path="/processos/novo" element={<CadastrarProcesso />} />
            <Route path="/processos/:id" element={<div>Detalhe do processo</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function paneDoStep(regex: RegExp) {
  const titulo = screen.getByText(regex)
  return within(titulo.closest('.card') as HTMLElement)
}

function processoFake(overrides: Partial<Processo> = {}): Processo {
  return {
    id: 'proc-1',
    protocolo: '001/2026',
    dataAbertura: '2026-05-20',
    doenca: 'raiva',
    laboratorio: 'pasteur_sp',
    ocorrenciaVinculado: null,
    statusProcesso: 'aberto',
    urgente: false,
    responsavel: { nome: 'Fulano de Tal' },
    amostras: [],
    criadoPorNome: 'Ana Silva',
    criadoEm: '2026-05-20T10:00:00Z',
    atualizadoEm: '2026-05-20T10:00:00Z',
    documentos: [],
    ...overrides,
  }
}

async function preencherEtapa1EAvancar(user: ReturnType<typeof userEvent.setup>) {
  const pane = paneDoStep(/^1\. Dados/)
  await user.click(pane.getByRole('button', { name: 'Pular esta etapa' }))
  await user.selectOptions(screen.getByLabelText(/Tipo de doença investigada/i), 'raiva')
  await user.selectOptions(screen.getByLabelText(/Laboratório de destino/i), 'pasteur_sp')
  await user.click(pane.getByRole('button', { name: 'Continuar →' }))
}

async function preencherEtapa2EAvancar(user: ReturnType<typeof userEvent.setup>) {
  const pane = paneDoStep(/^2\. Responsável/)
  await user.type(screen.getByLabelText(/^Nome/i), 'Maria Responsável')
  await user.click(pane.getByRole('button', { name: 'Continuar →' }))
}

async function preencherAmostraExternaMinima(user: ReturnType<typeof userEvent.setup>) {
  const pane = paneDoStep(/^3\. Amostras/)
  await user.click(pane.getByRole('button', { name: 'Novo animal' }))
  await user.selectOptions(screen.getByLabelText(/Espécie/i), 'canino')
  await user.selectOptions(screen.getByLabelText(/^Sexo/i), 'macho')
  await user.selectOptions(screen.getByLabelText(/Status clínico/i), 'assintomatico')
  await user.selectOptions(screen.getByLabelText(/Tipo de abrigo/i), 'intradomiciliar')
  await user.selectOptions(screen.getByLabelText(/Material biológico/i), 'soro')
}

describe('ProcessoForm — wizard de cadastro', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetOcorrenciasMock()
    resetProcessosMock()
  })

  it('etapa 1 sem decisão de vínculo não avança', async () => {
    const user = userEvent.setup()
    renderCadastrar()

    const pane = paneDoStep(/^1\. Dados/)
    // Preenche os demais campos da etapa para isolar a falta de DECISÃO do
    // vínculo (nem selecionou ocorrência, nem clicou "Pular esta etapa").
    await user.selectOptions(screen.getByLabelText(/Tipo de doença investigada/i), 'raiva')
    await user.selectOptions(screen.getByLabelText(/Laboratório de destino/i), 'pasteur_sp')
    await user.click(pane.getByRole('button', { name: 'Continuar →' }))

    expect(await screen.findByText(/Selecione uma ocorrência ou clique em "Pular esta etapa"/)).toBeInTheDocument()
    expect(screen.getByText('Vínculo').closest('.step')).toHaveClass('active')
  })

  it('selecionar uma ocorrência avança e trava o vínculo ao voltar', async () => {
    const user = userEvent.setup()
    renderCadastrar()

    await user.click(await screen.findByText('089/2026'))
    await user.selectOptions(screen.getByLabelText(/Tipo de doença investigada/i), 'raiva')
    await user.selectOptions(screen.getByLabelText(/Laboratório de destino/i), 'pasteur_sp')
    await user.click(paneDoStep(/^1\. Dados/).getByRole('button', { name: 'Continuar →' }))
    expect(screen.getByText('Responsável').closest('.step')).toHaveClass('active')

    await preencherEtapa2EAvancar(user)
    await user.click(paneDoStep(/^2\. Responsável/).getByRole('button', { name: '← Voltar' }))

    expect(screen.getByTestId('vinculo-travado')).toBeInTheDocument()
    expect(within(screen.getByTestId('vinculo-travado')).getByText(/089\/2026/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Pular esta etapa' })).not.toBeInTheDocument()
  })

  it('entrada via /ocorrencias/:id pré-preenche e trava o vínculo', async () => {
    renderCadastrar(`/processos/novo?ocorrencia=${OCORRENCIA_ABERTA_ID}`)

    const vinculo = await screen.findByTestId('vinculo-travado')
    expect(within(vinculo).getByText(/089\/2026/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Pular esta etapa' })).not.toBeInTheDocument()
  })

  it('?ocorrencia= de uma ocorrência já vinculada a outro processo mostra erro, sem travar', async () => {
    renderCadastrar(`/processos/novo?ocorrencia=${OCORRENCIA_PROCESSO_PENDENTE_ID}`)

    expect(await screen.findByText(/já tem o processo/i)).toBeInTheDocument()
    expect(screen.queryByTestId('vinculo-travado')).not.toBeInTheDocument()
  })

  it('cada etapa bloqueia avanço com campo obrigatório vazio', async () => {
    const user = userEvent.setup()
    renderCadastrar()

    await preencherEtapa1EAvancar(user)
    await user.click(paneDoStep(/^2\. Responsável/).getByRole('button', { name: 'Continuar →' }))

    expect(await screen.findByText('Informe o nome do responsável.')).toBeInTheDocument()
    expect(screen.getByText('Responsável').closest('.step')).toHaveClass('active')
  })

  it('marcar contato humano exibe o aviso de urgência; desmarcar remove', async () => {
    const user = userEvent.setup()
    renderCadastrar()
    await preencherEtapa1EAvancar(user)
    await preencherEtapa2EAvancar(user)

    expect(screen.queryByText(/ATENÇÃO — CONTATO HUMANO-ANIMAL/)).not.toBeInTheDocument()

    await user.click(screen.getByLabelText('Contato humano-animal'))
    expect(await screen.findByText(/ATENÇÃO — CONTATO HUMANO-ANIMAL/)).toBeInTheDocument()

    await user.click(screen.getByLabelText('Contato humano-animal'))
    expect(screen.queryByText(/ATENÇÃO — CONTATO HUMANO-ANIMAL/)).not.toBeInTheDocument()
  })

  it('revisão não oferece edição da etapa 1', async () => {
    const user = userEvent.setup()
    renderCadastrar()
    await preencherEtapa1EAvancar(user)
    await preencherEtapa2EAvancar(user)
    await preencherAmostraExternaMinima(user)
    await user.click(paneDoStep(/^3\. Amostras/).getByRole('button', { name: 'Continuar →' }))

    const revisao = paneDoStep(/^4\. Revisão/)
    expect(revisao.getAllByRole('button', { name: 'Editar' })).toHaveLength(2)
    expect(revisao.getByText('Sem vínculo')).toBeInTheDocument()
  })

  it('submit válido chama a mutation com o payload esperado e navega', async () => {
    vi.mocked(criarProcesso).mockResolvedValue(processoFake())
    const user = userEvent.setup()
    renderCadastrar()
    await preencherEtapa1EAvancar(user)
    await preencherEtapa2EAvancar(user)
    await preencherAmostraExternaMinima(user)
    await user.click(paneDoStep(/^3\. Amostras/).getByRole('button', { name: 'Continuar →' }))
    await user.click(paneDoStep(/^4\. Revisão/).getByRole('button', { name: /Registrar Processo Sanitário/ }))

    await waitFor(() => expect(criarProcesso).toHaveBeenCalledTimes(1))
    const [payload] = vi.mocked(criarProcesso).mock.calls[0] as [CriarProcessoRequest, string]
    expect(payload.ocorrenciaId).toBeNull()
    expect(payload.doenca).toBe('raiva')
    expect(payload.laboratorio).toBe('pasteur_sp')
    expect(payload.responsavel.nome).toBe('Maria Responsável')
    expect(payload.amostras).toHaveLength(1)
    expect(payload.amostras[0]).toMatchObject({ origem: 'externo', especieId: 'canino', sexo: 'macho' })
    expect(payload.amostras[0]).not.toHaveProperty('animalId')

    expect(await screen.findByText('Detalhe do processo')).toBeInTheDocument()
  })

  it('amostra "animal do canil": payload não carrega os dados do modo abandonado', async () => {
    vi.mocked(criarProcesso).mockResolvedValue(processoFake())
    const user = userEvent.setup()
    renderCadastrar()
    await preencherEtapa1EAvancar(user)
    await preencherEtapa2EAvancar(user)

    // Preenche o modo "Novo animal" primeiro, depois troca para "Já
    // cadastrado" e escolhe um animal do canil — o payload final não pode
    // carregar os campos digitados no modo abandonado.
    await preencherAmostraExternaMinima(user)
    const pane = paneDoStep(/^3\. Amostras/)
    await user.click(pane.getByRole('button', { name: 'Já cadastrado' }))
    await user.type(pane.getByLabelText(/Buscar animal do canil/i), 'Rex')
    await user.click(await pane.findByText('Rex'))

    await user.selectOptions(screen.getByLabelText(/Status clínico/i), 'assintomatico')
    await user.selectOptions(screen.getByLabelText(/Tipo de abrigo/i), 'intradomiciliar')
    await user.selectOptions(screen.getByLabelText(/Material biológico/i), 'soro')

    await user.click(pane.getByRole('button', { name: 'Continuar →' }))
    await user.click(paneDoStep(/^4\. Revisão/).getByRole('button', { name: /Registrar Processo Sanitário/ }))

    await waitFor(() => expect(criarProcesso).toHaveBeenCalledTimes(1))
    const [payload] = vi.mocked(criarProcesso).mock.calls[0] as [CriarProcessoRequest, string]
    expect(payload.amostras[0].origem).toBe('canil')
    expect(payload.amostras[0]).toHaveProperty('animalId')
    expect(payload.amostras[0].sexo).toBe('macho')
  })
})
