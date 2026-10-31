import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider, SESSION_STORAGE_KEY } from '@/features/auth/hooks/AuthContext'
import type { Usuario } from '@/features/auth/types/auth.types'
import { API_BASE_URL } from '@/lib/env'
import { server } from '@/mocks/server'
import { EditarAnimal } from './EditarAnimal'
import type { AnimalRequest } from '../types/animais.types'

// Auditoria de regras de negócio, itens I1 e N5: o PUT do animal substitui a
// ficha inteira, então um campo que o formulário envia vazio é apagado no
// servidor. Estes testes capturam o payload do PUT em três situações de edição
// em que a ficha do Rex (mock) tem porte "grande" e a baia "Baia 3". Nasceram
// como reprodução (tmp/reproducao-form-animal, f0d6dd7) e agora fixam a correção.

// O rascunho é controlado pelo teste (sem IndexedDB): por padrão, nenhum.
vi.mock('../storage/rascunhoAnimalStorage', async () => {
  const real = await vi.importActual<typeof import('../storage/rascunhoAnimalStorage')>('../storage/rascunhoAnimalStorage')
  return {
    ...real,
    carregarRascunhoAnimal: vi.fn().mockResolvedValue(null),
    salvarRascunhoAnimal: vi.fn().mockResolvedValue(undefined),
    removerRascunhoAnimal: vi.fn().mockResolvedValue(undefined),
    agendarSalvarRascunhoAnimal: vi.fn(),
  }
})

import { carregarRascunhoAnimal } from '../storage/rascunhoAnimalStorage'

const REX_ID = 'b2c3d4e5-0000-0000-0000-000000000001'
const BAIA_DO_REX = 'c3d4e5f6-0000-0000-0000-000000000001'
const USUARIO_ID = 'a1b2c3d4-0000-0000-0000-000000000001'

const GATIL_A = {
  id: 'c3d4e5f6-0000-0000-0000-000000000002',
  nome: 'Gatil A',
  tipoBaiaCodigo: 'gatil',
  tipoBaiaNome: 'Gatil',
  capacidade: 4,
  finalidade: null,
  ativa: true,
  observacoes: null,
  ocupacaoAtual: 1,
  superlotada: false,
}
const BAIA_3 = { ...GATIL_A, id: BAIA_DO_REX, nome: 'Baia 3', tipoBaiaCodigo: 'canil', tipoBaiaNome: 'Canil', capacidade: 2 }

function pagina<T>(itens: T[]) {
  return { itens, pagina: 0, tamanho: itens.length, totalItens: itens.length, totalPaginas: 1 }
}

function renderEditar() {
  const usuario: Usuario = {
    id: USUARIO_ID,
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
      <MemoryRouter initialEntries={[`/animais/${REX_ID}/editar`]}>
        <AuthProvider>
          <Routes>
            <Route path="/animais" element={<div>Lista de animais</div>} />
            <Route path="/animais/:id/editar" element={<EditarAnimal />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

// Captura o corpo do PUT; o handler responde 200 como o backend.
function capturarPut() {
  const captura: { corpo: AnimalRequest | null } = { corpo: null }
  server.use(
    http.put(`${API_BASE_URL}/animais/:id`, async ({ request }) => {
      captura.corpo = (await request.json()) as AnimalRequest
      return HttpResponse.json({ id: REX_ID }, { status: 200 })
    }),
  )
  return captura
}

// Fluxo de quem só quer salvar sem mexer em porte nem baia.
async function salvarSemMexerEmPorteEBaia(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /próximo: saúde/i }))
  const selectBaia = screen.getByLabelText(/baia atual/i) as HTMLSelectElement
  const baiaNaTela = selectBaia.options[selectBaia.selectedIndex]?.text ?? '(nenhuma opção)'
  await user.click(screen.getByRole('button', { name: /próximo: foto/i }))
  await user.click(screen.getAllByRole('button', { name: /salvar alterações/i })[0])
  return baiaNaTela
}

beforeEach(() => {
  vi.mocked(carregarRascunhoAnimal).mockResolvedValue(null)
})


// Baias que só chegam quando o teste libera (cenário 2).
function baiasComAtraso() {
  let liberar: () => void = () => {}
  const liberadas = new Promise<void>((resolve) => {
    liberar = resolve
  })
  server.use(
    http.get(`${API_BASE_URL}/baias`, async () => {
      await liberadas
      return HttpResponse.json(pagina([BAIA_3, GATIL_A]))
    }),
  )
  return () => liberar()
}

// Rascunho da edição salvo quando o Rex ainda não tinha porte nem baia;
// depois disso a ficha passou a ter porte "grande" e a "Baia 3".
const RASCUNHO_ANTIGO = {
  nome: 'Rex',
  especie: 'canino',
  sexo: 'macho',
  raca: 'SRD',
  coloracao: 'Caramelo',
  pelagem: 'curta',
  porte: '',
  pesoKg: '28.5',
  idadeAprox: '3 anos',
  dataNascimentoAprox: '',
  microchip: '985121234567890',
  castracaoOpcao: 'orquiectomia',
  dataEsterilizacao: '2023-06-10',
  status: 'disponivel_adocao',
  motivoEntrada: 'resgate',
  dataEntrada: '2024-03-15',
  baiaId: '',
  fotoUrl: '',
  observacoes: '',
}

type Resultado = { baiaNaTela: string; corpo: AnimalRequest | null }

async function cenarioBaiaInativa(): Promise<Resultado> {
  const user = userEvent.setup()
  const put = capturarPut()
  server.use(http.get(`${API_BASE_URL}/baias`, () => HttpResponse.json(pagina([GATIL_A]))))
  renderEditar()
  expect(await screen.findByDisplayValue('Rex')).toBeInTheDocument()
  await waitFor(() => expect(screen.getAllByRole('option', { name: /Gatil A/ }).length).toBeGreaterThan(0))
  const baiaNaTela = await salvarSemMexerEmPorteEBaia(user)
  await waitFor(() => expect(put.corpo).not.toBeNull())
  return { baiaNaTela, corpo: put.corpo }
}

async function cenarioBaiasChegamDepoisDaFicha(): Promise<Resultado> {
  const user = userEvent.setup()
  const put = capturarPut()
  const liberarBaias = baiasComAtraso()
  renderEditar()
  expect(await screen.findByDisplayValue('Rex')).toBeInTheDocument()
  liberarBaias()
  await waitFor(() => expect(screen.getAllByRole('option', { name: /Baia 3/ }).length).toBeGreaterThan(0))
  const baiaNaTela = await salvarSemMexerEmPorteEBaia(user)
  await waitFor(() => expect(put.corpo).not.toBeNull())
  return { baiaNaTela, corpo: put.corpo }
}

describe('edição do animal — porte e baia existentes no PUT (I1, N5)', () => {
  it('cenário 1: baia atual inativa (fora da lista de baias ativas) não é apagada pelo PUT', async () => {
    const { corpo } = await cenarioBaiaInativa()
    expect(corpo).toMatchObject({ porte: 'grande', baiaId: BAIA_DO_REX })
  })

  it('cenário 1 (tela): com a baia atual inativa, o select não diz que o animal está sem baia', async () => {
    const { baiaNaTela, corpo } = await cenarioBaiaInativa()
    expect(baiaNaTela).toBe('Baia atual')
    expect(corpo?.baiaId).toBe(BAIA_DO_REX)
  })

  // Salvar antes de a lista chegar mantém a baia no PUT.
  it('cenário 2a: salvar antes de a lista de baias chegar não apaga a baia', async () => {
    const user = userEvent.setup()
    const put = capturarPut()
    const liberarBaias = baiasComAtraso()

    renderEditar()
    expect(await screen.findByDisplayValue('Rex')).toBeInTheDocument()
    const baiaNaTela = await salvarSemMexerEmPorteEBaia(user)

    await waitFor(() => expect(put.corpo).not.toBeNull())
    liberarBaias()
    expect(baiaNaTela).toBe('Baia atual')
    expect(put.corpo).toMatchObject({ porte: 'grande', baiaId: BAIA_DO_REX })
  })

  // O PUT mantém a baia quando as opções chegam depois.
  it('cenário 2b: baias que chegam depois da ficha não apagam a baia no PUT', async () => {
    const { corpo } = await cenarioBaiasChegamDepoisDaFicha()
    expect(corpo).toMatchObject({ porte: 'grande', baiaId: BAIA_DO_REX })
  })

  it('cenário 2b (tela): baias que chegam depois da ficha deixam o select na baia do animal', async () => {
    const { baiaNaTela, corpo } = await cenarioBaiasChegamDepoisDaFicha()
    expect(baiaNaTela).toMatch(/^Baia 3/)
    expect(corpo?.baiaId).toBe(BAIA_DO_REX)
  })

  // Se o rascunho deve prevalecer sobre a ficha atual segue como decisão de
  // produto (N5). Aqui só se fixa que a ordem de carregamento das opções não
  // apaga a baia: o campo vazio do rascunho mantém o valor da ficha.
  it('cenário 3: restaurar um rascunho antigo sem baia mantém a baia no PUT', async () => {
    const user = userEvent.setup()
    const put = capturarPut()
    vi.mocked(carregarRascunhoAnimal).mockResolvedValue({ dados: RASCUNHO_ANTIGO, salvoEm: Date.now() })

    renderEditar()
    expect(await screen.findByDisplayValue('Rex')).toBeInTheDocument()
    await waitFor(() => expect(screen.getAllByRole('option', { name: /Baia 3/ }).length).toBeGreaterThan(0))
    await user.click(await screen.findByRole('button', { name: 'Restaurar rascunho' }))
    const baiaNaTela = await salvarSemMexerEmPorteEBaia(user)

    await waitFor(() => expect(put.corpo).not.toBeNull())
    expect(baiaNaTela).toMatch(/^Baia 3/)
    expect(put.corpo).toMatchObject({ porte: 'grande', nome: 'Rex', baiaId: BAIA_DO_REX })
  })
})
