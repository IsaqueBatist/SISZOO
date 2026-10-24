import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider, SESSION_STORAGE_KEY } from '@/features/auth/hooks/AuthContext'
import type { Usuario } from '@/features/auth/types/auth.types'
import { API_BASE_URL } from '@/lib/env'
import { abrirBancoRascunhos, VALIDADE_RASCUNHO_MS } from '@/lib/rascunhoDb'
import { server } from '@/mocks/server'
import { instalarIndexedDbEmMemoria } from '@/test/indexedDbEmMemoria'
import { CadastrarAnimal } from './CadastrarAnimal'

// IndexedDB de verdade (fake-indexeddb), sem mock do módulo de rascunho: o que
// está sob teste é o ciclo de vida da store 'arquivos' da T42 — a foto vai
// como Blob, volta na restauração e sai quando o cadastro dá certo.
const DATA_URI_FOTO = 'data:image/jpeg;base64,ZmFrZS1jb21wcmltaWRh'

// jsdom não renderiza canvas, então a compressão real nunca funcionaria aqui;
// mesmo padrão de AnimalForm.test.tsx. As conversões data URI <-> Blob da T42
// continuam reais (vêm do importActual).
vi.mock('../utils/comprimirImagem', async () => {
  const real = await vi.importActual<typeof import('../utils/comprimirImagem')>('../utils/comprimirImagem')
  // Literal repetido de propósito: vi.mock é hoistado para o topo do arquivo e
  // não alcança a constante acima.
  return { ...real, comprimirImagem: vi.fn().mockResolvedValue('data:image/jpeg;base64,ZmFrZS1jb21wcmltaWRh') }
})

const USUARIO_ID = 'a1b2c3d4-0000-0000-0000-000000000001'
const CHAVE_RASCUNHO = `${USUARIO_ID}:novo`

function autenticar() {
  const usuario: Usuario = {
    id: USUARIO_ID,
    nome: 'Stéphanie',
    sobrenome: 'Lima',
    email: 'stephanie.lima@itu.sp.gov.br',
    cargos: ['Administrador'],
    senhaAlteradaEm: '2026-01-10T12:00:00Z',
  }
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ token: 'token-existente', usuario }))
}

function renderCadastrar() {
  autenticar()
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/animais/novo']}>
        <AuthProvider>
          <Routes>
            <Route path="/animais" element={<div>Lista de animais</div>} />
            <Route path="/animais/novo" element={<CadastrarAnimal />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

async function anexarFoto(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/nome do animal/i), 'Rex')
  await user.click(screen.getByRole('button', { name: /próximo: saúde/i }))
  await user.click(screen.getByRole('button', { name: /próximo: foto/i }))
  await user.upload(screen.getByLabelText(/foto do animal/i), new File(['imagem'], 'rex.jpg', { type: 'image/jpeg' }))
}

async function preencherObrigatoriosEEnviar(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('radio', { name: 'Canino' }))
  await user.click(screen.getByRole('radio', { name: 'Macho' }))
  await user.click(screen.getByRole('button', { name: /próximo: saúde/i }))
  await user.selectOptions(screen.getByLabelText(/^status/i), 'disponivel_adocao')
  await user.selectOptions(screen.getByLabelText(/motivo de entrada/i), 'resgate')
  await user.click(screen.getByRole('button', { name: /próximo: foto/i }))
  await user.click(screen.getByRole('button', { name: /cadastrar animal/i }))
}

describe('AnimalForm — foto no rascunho (T42)', () => {
  let conteudo: (store: string) => Promise<Record<string, unknown>>

  beforeEach(() => {
    conteudo = instalarIndexedDbEmMemoria().conteudo
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('a foto vai para a store de arquivos como Blob, e o rascunho guarda só o id', async () => {
    const user = userEvent.setup()
    renderCadastrar()

    await anexarFoto(user)

    await waitFor(async () => expect(Object.keys(await conteudo('arquivos'))).toHaveLength(1))
    const [registro] = Object.values(await conteudo('arquivos'))
    expect(registro).toBeInstanceOf(Blob)
    expect((registro as Blob).type).toBe('image/jpeg')

    await waitFor(async () => expect(await conteudo('animais')).toHaveProperty(CHAVE_RASCUNHO))
    const rascunho = (await conteudo('animais'))[CHAVE_RASCUNHO] as { fotoArquivoId?: string }
    expect(rascunho.fotoArquivoId).toBeTruthy()
    // Nada de base64 no rascunho de texto.
    expect(JSON.stringify(rascunho)).not.toContain('base64')
  }, 15000)

  it('a foto volta na restauração do rascunho', async () => {
    const user = userEvent.setup()
    const { unmount } = renderCadastrar()

    await anexarFoto(user)
    await waitFor(async () => expect(await conteudo('animais')).toHaveProperty(CHAVE_RASCUNHO))

    unmount()
    const { container } = renderCadastrar()
    await user.click(await screen.findByRole('button', { name: /restaurar rascunho/i }))

    // A pré-visualização tem alt="" (decorativa), então não expõe role="img" —
    // mesma consulta que AnimalForm.test.tsx já usa.
    await waitFor(() => expect(container.querySelector('img')).not.toBeNull())
    expect((container.querySelector('img') as HTMLImageElement).src).toBe(DATA_URI_FOTO)
  }, 15000)

  it('cadastro com sucesso apaga o rascunho e a foto', async () => {
    server.use(http.post(`${API_BASE_URL}/animais`, () => HttpResponse.json({ id: 'novo-animal' }, { status: 201 })))
    const user = userEvent.setup()
    renderCadastrar()

    await anexarFoto(user)
    await waitFor(async () => expect(Object.keys(await conteudo('arquivos'))).toHaveLength(1))

    await preencherObrigatoriosEEnviar(user)

    expect(await screen.findByText('Lista de animais')).toBeInTheDocument()
    await waitFor(async () => expect(await conteudo('animais')).toEqual({}))
    expect(await conteudo('arquivos')).toEqual({})
  }, 20000)

  it('falha de rede no envio mantém o rascunho e a foto', async () => {
    server.use(http.post(`${API_BASE_URL}/animais`, () => HttpResponse.error()))
    const user = userEvent.setup()
    renderCadastrar()

    await anexarFoto(user)
    await waitFor(async () => expect(Object.keys(await conteudo('arquivos'))).toHaveLength(1))

    await preencherObrigatoriosEEnviar(user)

    expect(await screen.findByText(/Não foi possível salvar o animal/)).toBeInTheDocument()
    await waitFor(async () => expect(await conteudo('animais')).toHaveProperty(CHAVE_RASCUNHO))
    expect(Object.keys(await conteudo('arquivos'))).toHaveLength(1)
  }, 20000)

  it('descartar o rascunho apaga a foto do disco', async () => {
    const user = userEvent.setup()
    const { unmount } = renderCadastrar()

    await anexarFoto(user)
    await waitFor(async () => expect(await conteudo('animais')).toHaveProperty(CHAVE_RASCUNHO))

    unmount()
    renderCadastrar()
    await user.click(await screen.findByRole('button', { name: /^descartar$/i }))

    await waitFor(async () => expect(await conteudo('animais')).toEqual({}))
    await waitFor(async () => expect(await conteudo('arquivos')).toEqual({}))
  }, 15000)

  it('rascunho vencido não é oferecido', async () => {
    const banco = await abrirBancoRascunhos()
    await banco.put(
      'animais',
      { dados: { nome: 'Antigo', dataEntrada: '2026-01-01' }, salvoEm: Date.now() - VALIDADE_RASCUNHO_MS - 1000 } as never,
      CHAVE_RASCUNHO,
    )
    banco.close()

    renderCadastrar()

    expect(await screen.findByRole('button', { name: /cadastrar animal/i })).toBeInTheDocument()
    expect(screen.queryByText(/Encontramos um rascunho salvo/)).not.toBeInTheDocument()
    // E já saiu do disco na leitura.
    await waitFor(async () => expect(await conteudo('animais')).toEqual({}))
  }, 15000)
})
