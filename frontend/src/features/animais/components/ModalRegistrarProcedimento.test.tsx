import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AuthProvider, SESSION_STORAGE_KEY } from '@/features/auth/hooks/AuthContext'
import type { Usuario } from '@/features/auth/types/auth.types'
import { hojeEmItu } from '@/lib/datas'
import { API_BASE_URL } from '@/lib/env'
import { server } from '@/mocks/server'
import { adicionarDiasIso } from '@/test/datas'
import { AbaProcedimentos } from './AbaProcedimentos'

const REX_ID = 'b2c3d4e5-0000-0000-0000-000000000001'

function renderAba() {
  const usuario: Usuario = {
    id: 'a1b2c3d4-0000-0000-0000-000000000001',
    nome: 'Stéphanie',
    sobrenome: 'Lima',
    email: 'stephanie.lima@itu.sp.gov.br',
    cargos: ['Administrador'],
    senhaAlteradaEm: '2026-01-10T12:00:00Z',
  }
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ token: 'token-existente', usuario }))

  // Sem retry: o teste de erro do catálogo mostra a falha na primeira resposta.
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AuthProvider>
          <AbaProcedimentos animalId={REX_ID} onRegistroCriado={() => {}} />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('ModalRegistrarProcedimento — catálogo de tipos da API', () => {
  it('falha ao carregar bloqueia o envio; "Tentar novamente" recupera as opções', async () => {
    let chamadas = 0
    server.use(
      http.get(`${API_BASE_URL}/animais/catalogos`, () => {
        chamadas += 1
        if (chamadas === 1) return HttpResponse.json({ mensagem: 'Erro interno' }, { status: 500 })
        return HttpResponse.json({
          especies: [],
          status: [],
          motivosEntrada: [],
          tiposBaia: [],
          vacinas: [],
          tiposProcedimento: [{ codigo: 'castracao', nome: 'Castração' }],
        })
      }),
    )
    const user = userEvent.setup()
    renderAba()

    await screen.findByText('Castração')
    await user.click(screen.getByRole('button', { name: /registrar procedimento/i }))
    const modal = screen.getByRole('heading', { name: 'Registrar procedimento' }).closest<HTMLElement>('.modal')
    if (!modal) throw new Error('modal não encontrado')

    expect(await within(modal).findByText('Não foi possível carregar as opções.')).toBeInTheDocument()
    expect(within(modal).getByRole('button', { name: /^registrar procedimento$/i })).toBeDisabled()

    await user.click(within(modal).getByRole('button', { name: 'Tentar novamente' }))

    expect(await within(modal).findByRole('option', { name: 'Castração' })).toBeInTheDocument()
    expect(within(modal).getByRole('button', { name: /^registrar procedimento$/i })).toBeEnabled()
  })
})

describe('ModalRegistrarProcedimento', () => {
  it('registra um novo procedimento e a lista reflete o novo registro', async () => {
    const user = userEvent.setup()
    renderAba()

    await screen.findByText('Castração')
    await user.click(screen.getByRole('button', { name: /registrar procedimento/i }))

    const modal = screen.getByRole('heading', { name: 'Registrar procedimento' }).closest<HTMLElement>('.modal')
    if (!modal) throw new Error('modal não encontrado')
    // O select do catálogo só aparece depois de GET /animais/catalogos.
    await within(modal).findByRole('option', { name: 'Castração' })

    await user.selectOptions(within(modal).getByLabelText(/tipo de procedimento/i), 'vacinacao')
    await user.type(within(modal).getByLabelText(/^data/i), '2026-05-01')
    await user.type(within(modal).getByLabelText(/descrição/i), 'Hemograma completo.')
    await user.click(within(modal).getByRole('button', { name: /^registrar procedimento$/i }))

    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Registrar procedimento' })).not.toBeInTheDocument())
    expect(await screen.findByText('Hemograma completo.')).toBeInTheDocument()
  })

  it('exige tipo de procedimento e data', async () => {
    const user = userEvent.setup()
    renderAba()

    await screen.findByText('Castração')
    await user.click(screen.getByRole('button', { name: /registrar procedimento/i }))

    const modal = screen.getByRole('heading', { name: 'Registrar procedimento' }).closest<HTMLElement>('.modal')
    if (!modal) throw new Error('modal não encontrado')
    // O select do catálogo só aparece depois de GET /animais/catalogos.
    await within(modal).findByRole('option', { name: 'Castração' })
    await user.click(within(modal).getByRole('button', { name: /^registrar procedimento$/i }))

    expect(await screen.findByText('Selecione o tipo de procedimento.')).toBeInTheDocument()
    expect(screen.getByText('Informe a data.')).toBeInTheDocument()
  })

  it('bloqueia data futura no formulário, sem enviar', async () => {
    let enviados = 0
    server.use(
      http.post(`${API_BASE_URL}/procedimentos`, () => {
        enviados += 1
        return HttpResponse.json({}, { status: 500 })
      }),
    )
    const user = userEvent.setup()
    renderAba()

    await screen.findByText('Castração')
    await user.click(screen.getByRole('button', { name: /registrar procedimento/i }))
    const modal = screen.getByRole('heading', { name: 'Registrar procedimento' }).closest<HTMLElement>('.modal')
    if (!modal) throw new Error('modal não encontrado')
    // O select do catálogo só aparece depois de GET /animais/catalogos.
    await within(modal).findByRole('option', { name: 'Castração' })

    await user.selectOptions(within(modal).getByLabelText(/tipo de procedimento/i), 'vacinacao')
    await user.type(within(modal).getByLabelText(/^data/i), adicionarDiasIso(hojeEmItu(), 1))
    await user.click(within(modal).getByRole('button', { name: /^registrar procedimento$/i }))

    expect(await within(modal).findByText('A data do procedimento não pode ser futura.')).toBeInTheDocument()
    expect(enviados).toBe(0)
  })

  it('erro 422 com `campos` aparece no campo, não como mensagem geral', async () => {
    server.use(
      http.post(`${API_BASE_URL}/procedimentos`, () =>
        HttpResponse.json(
          {
            mensagem: 'Data do procedimento nao pode ser futura',
            campos: [{ campo: 'data', mensagem: 'Data do procedimento nao pode ser futura' }],
          },
          { status: 422 },
        ),
      ),
    )
    const user = userEvent.setup()
    renderAba()

    await screen.findByText('Castração')
    await user.click(screen.getByRole('button', { name: /registrar procedimento/i }))
    const modal = screen.getByRole('heading', { name: 'Registrar procedimento' }).closest<HTMLElement>('.modal')
    if (!modal) throw new Error('modal não encontrado')
    // O select do catálogo só aparece depois de GET /animais/catalogos.
    await within(modal).findByRole('option', { name: 'Castração' })

    await user.selectOptions(within(modal).getByLabelText(/tipo de procedimento/i), 'vacinacao')
    await user.type(within(modal).getByLabelText(/^data/i), hojeEmItu())
    await user.click(within(modal).getByRole('button', { name: /^registrar procedimento$/i }))

    const campoData = within(modal).getByLabelText(/^data/i).closest<HTMLElement>('.field')
    if (!campoData) throw new Error('campo não encontrado')
    expect(await within(campoData).findByText('Data do procedimento nao pode ser futura')).toBeInTheDocument()
    expect(within(modal).queryByRole('alert')).not.toBeInTheDocument()
  })

  it('corrige um procedimento existente sem alterar o original (retifica)', async () => {
    const user = userEvent.setup()
    renderAba()

    const linhaOriginal = (await screen.findByText('Atendimento clínico')).closest('tr')
    if (!linhaOriginal) throw new Error('linha não encontrada')
    await user.click(within(linhaOriginal).getByRole('button', { name: /corrigir/i }))

    const modal = screen.getByRole('heading', { name: 'Corrigir procedimento' }).closest<HTMLElement>('.modal')
    if (!modal) throw new Error('modal não encontrado')
    // O select do catálogo só aparece depois de GET /animais/catalogos.
    await within(modal).findByRole('option', { name: 'Castração' })
    expect(within(modal).getByText(/o registro original não será alterado/i)).toBeInTheDocument()
    expect(within(modal).getByLabelText(/^data/i)).not.toHaveValue('')

    await user.clear(within(modal).getByLabelText(/resultado/i))
    await user.type(within(modal).getByLabelText(/resultado/i), 'Resultado corrigido.')
    await user.click(within(modal).getByRole('button', { name: /^salvar correção$/i }))

    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Corrigir procedimento' })).not.toBeInTheDocument())
    expect(await screen.findByText('Resultado corrigido.')).toBeInTheDocument()
    const linhasAtendimento = (await screen.findAllByText('Atendimento clínico')).map((celula) => celula.closest('tr'))
    const comBadgeRetificado = linhasAtendimento.filter(
      (linha): linha is HTMLTableRowElement => linha !== null && within(linha).queryByText('Retificado') !== null,
    )
    expect(comBadgeRetificado).toHaveLength(1)
  })
})
