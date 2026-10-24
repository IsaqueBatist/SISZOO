import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider, SESSION_STORAGE_KEY } from '@/features/auth/hooks/AuthContext'
import type { Usuario } from '@/features/auth/types/auth.types'
import { API_BASE_URL } from '@/lib/env'
import { ocorrenciaCriadaFixture } from '@/mocks/ocorrenciasFixtures'
import { server } from '@/mocks/server'
import { instalarIndexedDbEmMemoria } from '@/test/indexedDbEmMemoria'
import { CadastrarOcorrencia } from './CadastrarOcorrencia'

// Ocorrência sigilosa: nada do denunciante vai para o IndexedDB — nem no
// rascunho, nem na pendência de anexos (D15) — e a pendência é só do usuário
// que registrou.
const USUARIO_A = 'a1b2c3d4-0000-0000-0000-00000000000a'
const USUARIO_B = 'a1b2c3d4-0000-0000-0000-00000000000b'
const NOME_DENUNCIANTE = 'Fulano Sigiloso'
const CPF_DENUNCIANTE = '12345678909'

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

  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
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

describe('ocorrência sigilosa no IndexedDB', () => {
  let conteudo: (store: string) => Promise<Record<string, unknown>>

  beforeEach(() => {
    conteudo = instalarIndexedDbEmMemoria().conteudo
    server.use(
      http.post(`${API_BASE_URL}/ocorrencias`, () => HttpResponse.json(ocorrenciaCriadaFixture(), { status: 201 })),
      http.post(`${API_BASE_URL}/ocorrencias/:id/anexos`, () => new HttpResponse(null, { status: 503 })),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('o anexo da sigilosa não vai para o disco, e a pendência não aparece para outro usuário', async () => {
    const user = userEvent.setup()
    const { unmount } = renderCadastroComo(USUARIO_A)

    await user.click(screen.getByLabelText('Ocorrência sigilosa'))
    await user.type(screen.getByLabelText(/Nome completo/i), NOME_DENUNCIANTE)
    await user.type(screen.getByLabelText(/^CPF/i), CPF_DENUNCIANTE)
    await user.type(screen.getByLabelText(/Endereço da ocorrência/i), 'Rua Teste, 10')
    await user.type(screen.getByLabelText(/^Bairro/i), 'Bairro Teste')
    await user.type(screen.getByLabelText(/Descrição da ocorrência/i), 'Descrição de teste para a ocorrência.')

    // T42: o rascunho agora guarda o denunciante, inclusive na sigilosa
    // (decisão dos dois autores, docs/decisoes/T42.md).
    await waitFor(async () =>
      expect(JSON.stringify((await conteudo('ocorrencias'))[`${USUARIO_A}:novo`])).toContain('Descrição de teste'),
    )
    expect(JSON.stringify(await conteudo('ocorrencias'))).toContain(NOME_DENUNCIANTE)

    // Já o ANEXO da sigilosa não é gravado: pode ser a foto do local ou um
    // documento do denunciante protegido.
    await user.upload(screen.getByLabelText('Adicionar anexo'), [new File(['a'], 'a.png', { type: 'image/png' })])
    expect(await screen.findByText(/anexos não são guardados no rascunho/)).toBeInTheDocument()
    expect(await conteudo('arquivos')).toEqual({})

    await user.click(screen.getByRole('button', { name: 'Registrar Ocorrência' }))
    await screen.findByText(/Há anexos pendentes/)

    // Depois do POST: só a pendência, com id, protocolo e arquivos — e nada do
    // denunciante nela (D15 inalterada), nem resto na store de arquivos.
    const store = await conteudo('ocorrencias')
    expect(Object.keys(store)).toEqual([`${USUARIO_A}:anexos-pendentes`])
    expect(Object.keys(store[`${USUARIO_A}:anexos-pendentes`] as object).sort()).toEqual(['anexos', 'ocorrenciaId', 'protocolo'])
    expect(JSON.stringify(store)).not.toContain(NOME_DENUNCIANTE)
    expect(await conteudo('arquivos')).toEqual({})

    unmount()
    sessionStorage.clear()
    renderCadastroComo(USUARIO_B)

    const registrar = await screen.findByRole('button', { name: 'Registrar Ocorrência' })
    await waitFor(() => expect(registrar).toBeEnabled())
    expect(screen.queryByText(/Há anexos pendentes/)).not.toBeInTheDocument()
  }, 15000)

  it('ocorrência comum guarda o anexo e o devolve na restauração', async () => {
    const user = userEvent.setup()
    const { unmount } = renderCadastroComo(USUARIO_A)

    await user.type(screen.getByLabelText(/Nome completo/i), 'Denunciante Comum')
    await user.type(screen.getByLabelText(/^Bairro/i), 'Bairro Teste')
    await user.upload(screen.getByLabelText('Adicionar anexo'), [new File(['conteudo'], 'laudo.png', { type: 'image/png' })])

    await waitFor(async () => expect(Object.keys(await conteudo('arquivos'))).toHaveLength(1))
    await waitFor(async () =>
      expect(JSON.stringify((await conteudo('ocorrencias'))[`${USUARIO_A}:novo`])).toContain('laudo.png'),
    )
    // No rascunho de texto fica só a referência, nunca o conteúdo.
    expect(JSON.stringify((await conteudo('ocorrencias'))[`${USUARIO_A}:novo`])).not.toContain('conteudo')

    unmount()
    renderCadastroComo(USUARIO_A)
    await user.click(await screen.findByRole('button', { name: 'Restaurar rascunho' }))

    expect(await screen.findByText('laudo.png')).toBeInTheDocument()
  }, 15000)

  it('remover o anexo apaga o arquivo do disco', async () => {
    const user = userEvent.setup()
    renderCadastroComo(USUARIO_A)

    await user.type(screen.getByLabelText(/^Bairro/i), 'Bairro Teste')
    await user.upload(screen.getByLabelText('Adicionar anexo'), [new File(['x'], 'remover.png', { type: 'image/png' })])
    await waitFor(async () => expect(Object.keys(await conteudo('arquivos'))).toHaveLength(1))

    await user.click(screen.getByRole('button', { name: 'Remover remover.png' }))

    await waitFor(async () => expect(await conteudo('arquivos')).toEqual({}))
  }, 15000)

  it('marcar o sigilo depois de anexar apaga o arquivo já gravado', async () => {
    const user = userEvent.setup()
    renderCadastroComo(USUARIO_A)

    await user.type(screen.getByLabelText(/^Bairro/i), 'Bairro Teste')
    await user.upload(screen.getByLabelText('Adicionar anexo'), [new File(['x'], 'antes.png', { type: 'image/png' })])
    await waitFor(async () => expect(Object.keys(await conteudo('arquivos'))).toHaveLength(1))

    await user.click(screen.getByLabelText('Ocorrência sigilosa'))

    await waitFor(async () => expect(await conteudo('arquivos')).toEqual({}))
    expect(await screen.findByText(/anexos não são guardados no rascunho/)).toBeInTheDocument()
  }, 15000)
})
