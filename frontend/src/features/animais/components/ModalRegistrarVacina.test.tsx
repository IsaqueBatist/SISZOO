import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AuthProvider, SESSION_STORAGE_KEY } from '@/features/auth/hooks/AuthContext'
import type { Usuario } from '@/features/auth/types/auth.types'
import { API_BASE_URL } from '@/lib/env'
import { server } from '@/mocks/server'
import { adicionarDiasIso } from '@/test/datas'
import { AbaVacinas } from './AbaVacinas'
import { hojeEmItu } from '../utils/regrasVacina'

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

  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AuthProvider>
          <AbaVacinas animalId={REX_ID} onRegistroCriado={() => {}} />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

// Espiona o POST sem substituir o handler padrão: o resolver só registra o
// corpo e não devolve resposta, então o MSW segue para o handler de
// mocks/handlers.ts (clone(): o corpo continua legível por ele).
function espionarPostDeVacinacao(): unknown[] {
  const corpos: unknown[] = []
  server.use(
    http.post(`${API_BASE_URL}/vacinacoes`, async ({ request }) => {
      corpos.push(await request.clone().json())
    }),
  )
  return corpos
}

async function abrirModalDeRegistro(user: ReturnType<typeof userEvent.setup>) {
  renderAba()
  await screen.findByText('V10')
  await user.click(screen.getByRole('button', { name: /registrar vacina/i }))
  const modal = screen.getByRole('heading', { name: 'Registrar vacina' }).closest<HTMLElement>('.modal')
  if (!modal) throw new Error('modal não encontrado')
  return modal
}

// Preenche todos os obrigatórios, exceto a unidade da dose.
async function preencherObrigatoriosSemUnidade(
  user: ReturnType<typeof userEvent.setup>,
  modal: HTMLElement,
  dataAplicacao: string,
) {
  await user.selectOptions(within(modal).getByLabelText(/^vacina/i), 'antirrabica')
  await user.type(within(modal).getByLabelText(/data de aplicação/i), dataAplicacao)
  await user.type(within(modal).getByLabelText(/quantidade da dose/i), '1')
}

describe('ModalRegistrarVacina — validação', () => {
  it('[RN-C05] sem unidade não envia; com a unidade selecionada envia uma vez com doseUnidade', async () => {
    const user = userEvent.setup()
    const corposEnviados = espionarPostDeVacinacao()
    const modal = await abrirModalDeRegistro(user)
    await preencherObrigatoriosSemUnidade(user, modal, hojeEmItu())

    await user.click(within(modal).getByRole('button', { name: /^registrar vacina$/i }))

    expect(await within(modal).findByText('Selecione a unidade da dose.')).toBeInTheDocument()
    expect(within(modal).getByLabelText(/^unidade/i)).toHaveClass('error')
    expect(corposEnviados).toHaveLength(0)

    // Controle: só a unidade faltava — com ela o mesmo formulário é enviado.
    await user.selectOptions(within(modal).getByLabelText(/^unidade/i), 'MILILITRO')
    await user.click(within(modal).getByRole('button', { name: /^registrar vacina$/i }))

    await waitFor(() => expect(corposEnviados).toHaveLength(1))
    expect(corposEnviados[0]).toMatchObject({ doseUnidade: 'MILILITRO', dataAplicacao: hojeEmItu() })
  })

  it('[RN-C06] bloqueia data de aplicação futura no formulário, sem enviar', async () => {
    const user = userEvent.setup()
    const corposEnviados = espionarPostDeVacinacao()
    const modal = await abrirModalDeRegistro(user)
    await preencherObrigatoriosSemUnidade(user, modal, adicionarDiasIso(hojeEmItu(), 1))
    await user.selectOptions(within(modal).getByLabelText(/^unidade/i), 'MILILITRO')

    await user.click(within(modal).getByRole('button', { name: /^registrar vacina$/i }))

    expect(await within(modal).findByText('A data de aplicação não pode ser futura.')).toBeInTheDocument()
    expect(within(modal).getByLabelText(/data de aplicação/i)).toHaveAttribute('max', hojeEmItu())
    expect(corposEnviados).toHaveLength(0)
  })

  it('exibe a mensagem de regra devolvida pela API (422) em vez do texto genérico', async () => {
    server.use(
      http.post(`${API_BASE_URL}/vacinacoes`, () =>
        HttpResponse.json({ mensagem: 'Data de aplicacao nao pode ser futura' }, { status: 422 }),
      ),
    )
    const user = userEvent.setup()
    const modal = await abrirModalDeRegistro(user)
    // Data válida no cliente: simula o servidor recusando (ex.: relógio do
    // navegador adiantado em relação ao do backend).
    await preencherObrigatoriosSemUnidade(user, modal, hojeEmItu())
    await user.selectOptions(within(modal).getByLabelText(/^unidade/i), 'MILILITRO')

    await user.click(within(modal).getByRole('button', { name: /^registrar vacina$/i }))

    expect(await within(modal).findByRole('alert')).toHaveTextContent('Data de aplicacao nao pode ser futura')
    expect(within(modal).queryByText(/não foi possível registrar/i)).not.toBeInTheDocument()
  })
})

describe('ModalRegistrarVacina — retifica', () => {
  it('corrige uma vacinação existente sem alterar o original, deixando o número da dose em branco', async () => {
    const user = userEvent.setup()
    renderAba()

    const linhaOriginal = (await screen.findByText('V10')).closest('tr')
    if (!linhaOriginal) throw new Error('linha não encontrada')
    await user.click(within(linhaOriginal).getByRole('button', { name: /corrigir/i }))

    const modal = screen.getByRole('heading', { name: 'Corrigir vacinação' }).closest<HTMLElement>('.modal')
    if (!modal) throw new Error('modal não encontrado')
    expect(within(modal).getByText(/o registro original não será alterado/i)).toBeInTheDocument()
    expect(within(modal).getByLabelText(/número da dose/i)).toHaveValue(1)

    // Número da dose é opcional: apagar o valor não pode travar o submit.
    await user.clear(within(modal).getByLabelText(/número da dose/i))
    await user.clear(within(modal).getByLabelText(/^lote/i))
    await user.type(within(modal).getByLabelText(/^lote/i), 'LOTE-99')
    await user.click(within(modal).getByRole('button', { name: /^salvar correção$/i }))

    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Corrigir vacinação' })).not.toBeInTheDocument())

    const linhasV10 = await waitFor(() => {
      const linhas = screen.getAllByText('V10').map((celula) => celula.closest('tr'))
      expect(linhas).toHaveLength(2)
      return linhas
    })
    const comBadgeRetificado = linhasV10.filter(
      (linha): linha is HTMLTableRowElement => linha !== null && within(linha).queryByText('Retificado') !== null,
    )
    expect(comBadgeRetificado).toHaveLength(1)
  })
})
