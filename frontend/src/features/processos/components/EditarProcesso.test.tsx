import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { Toasts } from '@/components/toast/Toasts'
import { AuthProvider, definirSessaoEmMemoria } from '@/features/auth/hooks/AuthContext'
import { API_BASE_URL } from '@/lib/env'
import { processoComResultadoFixture, processoFixture } from '@/mocks/processosFixtures'
import { server } from '@/mocks/server'
import { RotaAdmin } from '@/routes/RotaAdmin'
import { EditarProcesso } from './EditarProcesso'

const PROCESSO = processoFixture()
const ID = PROCESSO.id

function renderEdicao(cargos = ['Administrador']) {
  definirSessaoEmMemoria({
    token: 'token-existente',
    usuario: {
      id: 'a1b2c3d4-0000-0000-0000-000000000099',
      nome: 'Ana',
      sobrenome: 'Silva',
      email: 'ana.silva@itu.sp.gov.br',
      cargos,
      senhaAlteradaEm: '2026-01-10T12:00:00Z',
    },
  })
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter initialEntries={[`/processos/${ID}/editar`]}>
        <AuthProvider>
          <Routes>
            <Route element={<RotaAdmin />}>
              <Route path="/processos/:id/editar" element={<EditarProcesso />} />
            </Route>
            <Route path="/processos/:id" element={<div>Detalhe do processo</div>} />
            <Route path="/dashboard" element={<div>Painel</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
      <Toasts />
    </QueryClientProvider>,
  )
}

function capturarEdicao() {
  const corpos: unknown[] = []
  server.use(
    http.put(`${API_BASE_URL}/processos/:id`, async ({ request }) => {
      corpos.push(await request.json())
      return HttpResponse.json(PROCESSO)
    }),
  )
  return corpos
}

// Colar em vez de digitar: letra a letra, o formulário grande estoura o tempo do teste.
async function preencher(user: ReturnType<typeof userEvent.setup>, campo: HTMLElement, texto: string) {
  await user.click(campo)
  await user.paste(texto)
}

async function salvar(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Salvar alterações' }))
}

describe('EditarProcesso', () => {
  it('veterinário e agente não chegam à tela', async () => {
    renderEdicao(['Veterinário'])

    expect(await screen.findByText('Painel')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /editar processo/i })).not.toBeInTheDocument()
  })

  it('carrega os dados atuais, sem campo de abertura editável nem troca de amostra', async () => {
    renderEdicao()

    expect(await screen.findByLabelText(/^nome/i)).toHaveValue(PROCESSO.responsavel?.nome)
    expect(screen.getByLabelText(/data de abertura/i)).toBeDisabled()
    expect(screen.queryByRole('tablist', { name: 'Origem do animal' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /trocar animal/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /remover animal/i })).not.toBeInTheDocument()
  })

  it('exige o motivo antes de chamar a API', async () => {
    const corpos = capturarEdicao()
    const user = userEvent.setup()
    renderEdicao()

    await screen.findByLabelText(/^nome/i)
    await salvar(user)

    expect(await screen.findByText('Descreva o motivo da alteração em pelo menos 10 caracteres.')).toBeInTheDocument()
    expect(corpos).toHaveLength(0)
  })

  it('envia a correção com a justificativa e as amostras pelo id, e volta ao detalhe', async () => {
    const corpos = capturarEdicao()
    const user = userEvent.setup()
    renderEdicao()

    const nome = await screen.findByLabelText(/^nome/i)
    await user.clear(nome)
    await preencher(user, nome, 'Nome Corrigido')
    await preencher(user, screen.getByLabelText(/por que este processo/i), 'Nome digitado errado na abertura.')
    await salvar(user)

    expect(await screen.findByText('Detalhe do processo')).toBeInTheDocument()
    expect(await screen.findByText('Alterações salvas e registradas no histórico do processo.')).toBeInTheDocument()
    await waitFor(() => expect(corpos).toHaveLength(1))
    expect(corpos[0]).toMatchObject({
      justificativa: 'Nome digitado errado na abertura.',
      responsavel: { nome: 'Nome Corrigido' },
      amostras: [{ id: PROCESSO.amostras[0].id }],
    })
    expect(corpos[0]).not.toHaveProperty('dataAbertura')
  })

  it('recusa do servidor aparece no formulário e mantém o que foi digitado', async () => {
    server.use(
      http.put(`${API_BASE_URL}/processos/:id`, () =>
        HttpResponse.json({ mensagem: 'A doença não pode mudar depois de lançado o resultado.' }, { status: 422 }),
      ),
    )
    const user = userEvent.setup()
    renderEdicao()

    await screen.findByLabelText(/^nome/i)
    const motivo = screen.getByLabelText(/por que este processo/i)
    await preencher(user, motivo, 'Correção de teste com motivo.')
    await salvar(user)

    expect(await screen.findByText('A doença não pode mudar depois de lançado o resultado.')).toBeInTheDocument()
    expect(motivo).toHaveValue('Correção de teste com motivo.')
  })

  it('com resultado lançado, a doença fica travada e o envio mantém a doença do processo', async () => {
    const corpos = capturarEdicao()
    server.use(http.get(`${API_BASE_URL}/processos/${ID}`, () => HttpResponse.json(processoComResultadoFixture())))
    const user = userEvent.setup()
    renderEdicao()

    const doenca = await screen.findByLabelText(/tipo de doença/i)
    expect(doenca).toBeDisabled()
    await preencher(user, screen.getByLabelText(/por que este processo/i), 'Telefone do responsável corrigido.')
    await salvar(user)

    await waitFor(() => expect(corpos).toHaveLength(1))
    expect(corpos[0]).toMatchObject({ doenca: processoComResultadoFixture().doenca.codigo })
  })

  it('catálogo que demora não mostra outro valor: o select só aparece com a opção salva', async () => {
    let liberar: () => void = () => {}
    const catalogo = new Promise<void>((resolve) => {
      liberar = resolve
    })
    const fixtureFelino = {
      ...PROCESSO,
      amostras: [{ ...PROCESSO.amostras[0], animalId: null, especie: { codigo: 'felino', nome: 'Felino' } }],
    }
    const catalogos = await (await fetch(`${API_BASE_URL}/animais/catalogos`)).json()
    server.use(
      http.get(`${API_BASE_URL}/processos/${ID}`, () => HttpResponse.json(fixtureFelino)),
      http.get(`${API_BASE_URL}/animais/catalogos`, async () => {
        await catalogo
        return HttpResponse.json(catalogos)
      }),
    )
    renderEdicao()

    expect(await screen.findByText('Carregando processo…')).toBeInTheDocument()
    liberar()

    expect(await screen.findByLabelText(/^espécie/i)).toHaveDisplayValue('Felino')
  })

  it('o contato humano continua com as três respostas na edição', async () => {
    renderEdicao()

    await screen.findByLabelText(/^nome/i)

    const grupo = screen.getByRole('radiogroup', { name: /teve contato físico/i })
    expect(within(grupo).getByRole('radio', { name: 'Não informado' })).toBeInTheDocument()
  })
})
