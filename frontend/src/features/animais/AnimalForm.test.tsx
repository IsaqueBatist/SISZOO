import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { API_BASE_URL } from '../../lib/env'
import { server } from '../../mocks/server'
import { CadastrarAnimal } from './CadastrarAnimal'
import { EditarAnimal } from './EditarAnimal'
import type { AnimalRequest } from './animais.types'

// jsdom não implementa renderização de canvas (getContext('2d') retorna
// null), então a compressão real (comprimirImagem.ts) sempre falharia aqui.
// O teste de preview de foto mocka o módulo para validar só a integração
// (input de arquivo -> chamada de compressão -> estado -> <img>), não o
// algoritmo de compressão em si.
vi.mock('./comprimirImagem', async () => {
  const real = await vi.importActual<typeof import('./comprimirImagem')>('./comprimirImagem')
  return { ...real, comprimirImagem: vi.fn().mockResolvedValue('data:image/jpeg;base64,ZmFrZS1jb21wcmltaWRh') }
})

const REX_ID = 'b2c3d4e5-0000-0000-0000-000000000001'

function renderCadastrar() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/animais/novo']}>
        <Routes>
          <Route path="/animais" element={<div>Lista de animais</div>} />
          <Route path="/animais/novo" element={<CadastrarAnimal />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function renderEditar(id: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/animais/${id}/editar`]}>
        <Routes>
          <Route path="/animais" element={<div>Lista de animais</div>} />
          <Route path="/animais/:id/editar" element={<EditarAnimal />} />
        </Routes>
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
    // Nomes de resposta (com sufixo) nunca devem ser reenviados no request.
    expect(corpoCapturado).not.toHaveProperty('especieNome')
    expect(corpoCapturado).not.toHaveProperty('statusNome')
    expect(corpoCapturado).not.toHaveProperty('motivoEntradaNome')

    expect(await screen.findByText('Lista de animais')).toBeInTheDocument()
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
      http.post(`${API_BASE_URL}/animais`, () => HttpResponse.json({ mensagem: 'Microchip ja cadastrado' }, { status: 409 })),
    )

    renderCadastrar()
    await preencherDadosBasicosObrigatorios(user)
    await user.type(screen.getByLabelText(/microchip/i), '985121234567890')
    await avancarParaRevisao(user)
    await user.click(screen.getByRole('button', { name: /cadastrar animal/i }))

    const campoMicrochip = screen.getByLabelText(/microchip/i).closest('.field')
    expect(campoMicrochip).not.toBeNull()
    expect(await within(campoMicrochip as HTMLElement).findByText('Microchip ja cadastrado')).toBeInTheDocument()
    // O nome preenchido continua lá — reenvio sem perda de dados.
    expect(screen.getByLabelText(/nome do animal/i)).toHaveValue('Rex Teste')
  })

  it('preview de foto aparece após a seleção de um arquivo', async () => {
    const user = userEvent.setup()
    // A foto usa alt="" (decorativa, o nome já aparece em outro campo) — por
    // isso não tem role="img" acessível, e o teste busca via querySelector.
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
    // Rex já tem microchip cadastrado no mock: o campo deve travar (regra de
    // imutabilidade do backend replicada na UI).
    expect(screen.getByLabelText(/microchip/i)).toBeDisabled()

    await avancarParaRevisao(user)
    await user.click(screen.getByRole('button', { name: /salvar alterações/i }))

    await waitFor(() => expect(corpoCapturado).not.toBeNull())
    expect(corpoCapturado).toMatchObject({
      nome: 'Rex',
      especie: 'canino',
      microchip: '985121234567890',
    })

    expect(await screen.findByText('Lista de animais')).toBeInTheDocument()
  })
})
