import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider, definirSessaoEmMemoria } from '@/features/auth/hooks/AuthContext'
import type { Usuario } from '@/features/auth/types/auth.types'
import { API_BASE_URL } from '@/lib/env'
import { server } from '@/mocks/server'
import { CadastrarAnimal } from './CadastrarAnimal'
import { EditarAnimal } from './EditarAnimal'
import type { AnimalRequest } from '../types/animais.types'

vi.mock('../utils/comprimirImagem', async () => {
  const real = await vi.importActual<typeof import('../utils/comprimirImagem')>('../utils/comprimirImagem')
  return { ...real, comprimirImagem: vi.fn().mockResolvedValue('data:image/jpeg;base64,ZmFrZS1jb21wcmltaWRh') }
})

const REX_ID = 'b2c3d4e5-0000-0000-0000-000000000001'

const USUARIO_ID = 'a1b2c3d4-0000-0000-0000-000000000001'

function autenticar() {
  const usuario: Usuario = {
    id: USUARIO_ID,
    nome: 'Stéphanie',
    sobrenome: 'Lima',
    email: 'stephanie.lima@itu.sp.gov.br',
    cargos: ['Administrador'],
    senhaAlteradaEm: '2026-01-10T12:00:00Z',
  }
  definirSessaoEmMemoria({ token: 'token-existente', usuario })
}

function renderCadastrar() {
  autenticar()
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/animais/novo']}>
        <AuthProvider>
          <Routes>
            <Route path="/animais" element={<div>Lista de animais</div>} />
            <Route path="/animais/novo" element={<CadastrarAnimal />} />
            <Route path="/animais/:id" element={<div>Ficha do animal</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function renderEditar(id: string) {
  autenticar()
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/animais/${id}/editar`]}>
        <AuthProvider>
          <Routes>
            <Route path="/animais" element={<div>Lista de animais</div>} />
            <Route path="/animais/:id/editar" element={<EditarAnimal />} />
            <Route path="/animais/:id" element={<div>Ficha do animal</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

async function preencherDadosBasicosObrigatorios(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/nome do animal/i), 'Rex Teste')
  await user.click(await screen.findByRole('radio', { name: 'Canino' }))
  await user.click(screen.getByRole('radio', { name: 'Macho' }))
}

async function avancarParaRevisao(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /próximo: saúde/i }))
  await user.selectOptions(screen.getByLabelText(/^status/i), 'disponivel_adocao')
  await user.selectOptions(screen.getByLabelText(/motivo de entrada/i), 'resgate')
  await user.click(screen.getByRole('button', { name: /próximo: foto/i }))
}

describe('AnimalForm — cadastro', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('submit válido dispara POST com o payload correto (nomes de campo sem sufixo)', async () => {
    const user = userEvent.setup()
    let corpoCapturado: AnimalRequest | null = null

    server.use(
      http.post(`${API_BASE_URL}/animais`, async ({ request }) => {
        corpoCapturado = (await request.json()) as AnimalRequest
        return HttpResponse.json({ id: 'novo-id' }, { status: 201 })
      }),
    )

    renderCadastrar()
    await preencherDadosBasicosObrigatorios(user)
    await user.type(screen.getByLabelText(/microchip/i), '123456789012345')
    await avancarParaRevisao(user)

    await user.click(screen.getByRole('button', { name: /cadastrar animal/i }))

    await waitFor(() => expect(corpoCapturado).not.toBeNull())
    expect(corpoCapturado).toMatchObject({
      nome: 'Rex Teste',
      especie: 'canino',
      sexo: 'macho',
      microchip: '123456789012345',
      status: 'disponivel_adocao',
      motivoEntrada: 'resgate',
    })
    expect((corpoCapturado as AnimalRequest | null)?.esterilizado).toBeNull()
    expect(corpoCapturado).not.toHaveProperty('especieNome')
    expect(corpoCapturado).not.toHaveProperty('statusNome')
    expect(corpoCapturado).not.toHaveProperty('motivoEntradaNome')

    expect(await screen.findByText('Ficha do animal')).toBeInTheDocument()
  })

  it('campo obrigatório vazio impede o submit e não chama a API', async () => {
    const user = userEvent.setup()
    let postChamado = false
    server.use(
      http.post(`${API_BASE_URL}/animais`, () => {
        postChamado = true
        return HttpResponse.json({}, { status: 201 })
      }),
    )

    renderCadastrar()

    await user.click(screen.getByRole('button', { name: /próximo: saúde/i }))
    await user.click(screen.getByRole('button', { name: /próximo: foto/i }))
    await user.click(screen.getByRole('button', { name: /cadastrar animal/i }))

    expect(await screen.findByText(/informe o nome do animal/i)).toBeInTheDocument()
    expect(postChamado).toBe(false)
  })

  it('409 de microchip duplicado exibe a mensagem no campo microchip, sem limpar o formulário', async () => {
    const user = userEvent.setup()
    server.use(
      http.post(`${API_BASE_URL}/animais`, () => HttpResponse.json({ mensagem: 'Este microchip já está cadastrado em outro animal.' }, { status: 409 })),
    )

    renderCadastrar()
    await preencherDadosBasicosObrigatorios(user)
    await user.type(screen.getByLabelText(/microchip/i), '985121234567890')
    await avancarParaRevisao(user)
    await user.click(screen.getByRole('button', { name: /cadastrar animal/i }))

    const campoMicrochip = screen.getByLabelText(/microchip/i).closest('.field')
    expect(campoMicrochip).not.toBeNull()
    expect(await within(campoMicrochip as HTMLElement).findByText('Este microchip já está cadastrado em outro animal.')).toBeInTheDocument()
    expect(screen.getByLabelText(/nome do animal/i)).toHaveValue('Rex Teste')
  })

  it('preview de foto aparece após a seleção de um arquivo', async () => {
    const user = userEvent.setup()
    const { container } = renderCadastrar()

    await user.click(screen.getByRole('button', { name: /próximo: saúde/i }))
    await user.click(screen.getByRole('button', { name: /próximo: foto/i }))

    const arquivo = new File(['conteudo-fake'], 'foto.jpg', { type: 'image/jpeg' })
    const inputFoto = screen.getByLabelText(/foto do animal/i)
    await user.upload(inputFoto, arquivo)

    await waitFor(() => expect(container.querySelector('img')).not.toBeNull())
    const preview = container.querySelector('img') as HTMLImageElement
    expect(preview.src).toContain('data:image/jpeg;base64,ZmFrZS1jb21wcmltaWRh')
  })
})

describe('AnimalForm — edição', () => {
  it('carrega o animal existente e envia PUT ao salvar', async () => {
    const user = userEvent.setup()
    let corpoCapturado: AnimalRequest | null = null

    server.use(
      http.put(`${API_BASE_URL}/animais/:id`, async ({ request, params }) => {
        corpoCapturado = (await request.json()) as AnimalRequest
        expect(params.id).toBe(REX_ID)
        return HttpResponse.json({ id: REX_ID }, { status: 200 })
      }),
    )

    renderEditar(REX_ID)

    expect(await screen.findByDisplayValue('Rex')).toBeInTheDocument()
    expect(screen.getByLabelText(/microchip/i)).toBeDisabled()

    await avancarParaRevisao(user)
    await user.click(screen.getAllByRole('button', { name: /salvar alterações/i }).at(-1) as HTMLElement)

    await waitFor(() => expect(corpoCapturado).not.toBeNull())
    expect(corpoCapturado).toMatchObject({
      nome: 'Rex',
      especie: 'canino',
      microchip: '985121234567890',
      esterilizado: true,
    })

    expect(await screen.findByText('Ficha do animal')).toBeInTheDocument()
  })

  describe('campos F2-004/F2-008 vindos do GET', () => {
    const ID_COMPLETO = 'b2c3d4e5-0000-0000-0000-0000000000f2'

    function animalDoGet(sobrescrever: Record<string, unknown>) {
      return {
        id: ID_COMPLETO,
        nome: 'Pipoca',
        especieCodigo: 'canino',
        especieNome: 'Canino',
        sexo: 'macho',
        raca: null,
        coloracao: 'Caramelo',
        pelagem: null,
        porte: null,
        pesoKg: 12.5,
        idadeAprox: null,
        dataNascimentoAprox: null,
        microchip: '985121234567891',
        esterilizado: false,
        dataEsterilizacao: null,
        statusCodigo: 'disponivel_adocao',
        statusNome: 'Disponível para adoção',
        motivoEntradaCodigo: 'resgate',
        motivoEntradaNome: 'Resgate',
        dataEntrada: '2026-03-10T14:30:00',
        baiaId: null,
        baiaNome: null,
        tipoBaiaNome: null,
        fichaCompleta: false,
        fotoUrl: null,
        observacoes: null,
        criadoPorId: USUARIO_ID,
        criadoPorNome: 'Stéphanie Lima',
        criadoEm: '2026-03-10T14:30:00',
        atualizadoEm: '2026-03-10T14:30:00',
        numeroMedalha: 'M-0042',
        dataImplantacaoChip: '2026-03-11',
        procedencia: 'Bairro Brasil',
        laudoEutanasia: null,
        ...sobrescrever,
      }
    }

    async function salvarSemAlterar(user: ReturnType<typeof userEvent.setup>) {
      await user.click(screen.getByRole('button', { name: /próximo: saúde/i }))
      await user.click(screen.getByRole('button', { name: /próximo: foto/i }))
      await user.click(screen.getAllByRole('button', { name: /salvar alterações/i }).at(-1) as HTMLElement)
    }

    function capturarPut(animal: ReturnType<typeof animalDoGet>) {
      const capturado: { corpo: AnimalRequest | null } = { corpo: null }
      server.use(
        http.get(`${API_BASE_URL}/animais/${ID_COMPLETO}`, () => HttpResponse.json(animal)),
        http.put(`${API_BASE_URL}/animais/${ID_COMPLETO}`, async ({ request }) => {
          capturado.corpo = (await request.json()) as AnimalRequest
          return HttpResponse.json(animal, { status: 200 })
        }),
      )
      return capturado
    }

    it('reenvia medalha, data de implantação do chip e procedência sem o usuário tocar neles', async () => {
      const user = userEvent.setup()
      const put = capturarPut(animalDoGet({}))

      renderEditar(ID_COMPLETO)
      expect(await screen.findByDisplayValue('Pipoca')).toBeInTheDocument()
      await salvarSemAlterar(user)

      await waitFor(() => expect(put.corpo).not.toBeNull())
      expect(put.corpo).toMatchObject({
        numeroMedalha: 'M-0042',
        dataImplantacaoChip: '2026-03-11',
        procedencia: 'Bairro Brasil',
        pesoKg: 12.5,
        dataEntrada: '2026-03-10T14:30:00',
      })
    })

    it('reenvia o laudo de eutanásia de um animal já em óbito por eutanásia', async () => {
      const user = userEvent.setup()
      const laudo = 'Laudo 12/2026: eutanásia indicada por doença incurável.'
      const put = capturarPut(
        animalDoGet({ statusCodigo: 'obito_eutanasia', statusNome: 'Óbito (eutanásia)', laudoEutanasia: laudo }),
      )

      renderEditar(ID_COMPLETO)
      expect(await screen.findByDisplayValue('Pipoca')).toBeInTheDocument()
      await salvarSemAlterar(user)

      await waitFor(() => expect(put.corpo).not.toBeNull())
      expect(put.corpo).toMatchObject({ status: 'obito_eutanasia', laudoEutanasia: laudo })
    })
  })
})

describe('AnimalForm — edição com catálogo lento', () => {
  it('o status do animal aparece certo mesmo com o catálogo chegando depois da ficha', async () => {
    const catalogos = await (await fetch(`${API_BASE_URL}/animais/catalogos`)).json()
    let liberar: () => void = () => {}
    const atraso = new Promise<void>((resolve) => {
      liberar = resolve
    })
    server.use(
      http.get(`${API_BASE_URL}/animais/catalogos`, async () => {
        await atraso
        return HttpResponse.json(catalogos)
      }),
    )
    const user = userEvent.setup()
    renderEditar('b2c3d4e5-0000-0000-0000-000000000001')

    expect(await screen.findByText('Carregando animal…')).toBeInTheDocument()
    liberar()
    await user.click(await screen.findByRole('button', { name: /próximo: saúde/i }))

    expect(((screen.getByLabelText(/^status/i) as HTMLSelectElement).value)).toBe('disponivel_adocao')
  })
})

describe('AnimalForm — condições de saúde', () => {
  it('oferece as condições na etapa de saúde e exige descrever "Outras"', async () => {
    const user = userEvent.setup()
    renderCadastrar()

    await preencherDadosBasicosObrigatorios(user)
    await user.click(screen.getByRole('button', { name: /próximo: saúde/i }))

    const grupo = await screen.findByRole('group', { name: 'Condições de saúde pré-existentes' })
    await user.click(await within(grupo).findByLabelText('Epilepsia'))
    await user.click(within(grupo).getByLabelText(/outras/i))

    expect(screen.getByLabelText(/qual é a outra condição/i)).toBeInTheDocument()
  })
})

describe('AnimalForm — etapas', () => {
  it('Próximo valida a etapa e mantém a pessoa nela, com o erro na tela', async () => {
    const user = userEvent.setup()
    renderCadastrar()

    await user.click(await screen.findByRole('button', { name: /Próximo: Saúde/ }))

    expect(await screen.findByText('Informe o nome do animal.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Dados básicos' }).closest('.step-pane')).toHaveClass('active')
  })
})
