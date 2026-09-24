import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { CardEncerramento } from './CardEncerramento'
import type { Ocorrencia } from './ocorrencias.types'

// Mesmo id semeado em mocks/handlers.ts (OCORRENCIA_ABERTA_ID) — necessário
// só no teste que de fato dispara o PATCH /ocorrencias/:id/encerrar via MSW.
const OCORRENCIA_ABERTA_ID = 'h5000000-0000-0000-0000-000000000001'

function criarOcorrencia(sobrescrever: Partial<Ocorrencia> = {}): Ocorrencia {
  return {
    id: OCORRENCIA_ABERTA_ID,
    protocolo: '089/2026',
    tipoOcorrencia: 'zoonose',
    statusOcorrencia: 'aberta',
    dataAbertura: '2026-05-20',
    horaAbertura: '10:32',
    endereco: 'Rua das Acácias, 145',
    bairro: 'Vila Esperança',
    pontoReferencia: null,
    descricao: 'Descrição de teste.',
    urgente: false,
    sigilosa: false,
    registradoPorNome: 'Rafael Santos',
    providenciaTomada: null,
    descricaoEncerramento: null,
    encerradaEm: null,
    processoVinculado: null,
    denunciante: null,
    denunciado: null,
    movimentacoes: [],
    anexos: [],
    criadoEm: '2026-05-20T10:32:00Z',
    atualizadoEm: '2026-05-20T10:32:00Z',
    ...sobrescrever,
  }
}

function renderCard(ocorrencia: Ocorrencia, podeEncerrar: boolean) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <CardEncerramento ocorrencia={ocorrencia} podeEncerrar={podeEncerrar} />
    </QueryClientProvider>,
  )
}

describe('CardEncerramento', () => {
  it('bloqueia o envio quando nenhuma providência é selecionada', async () => {
    const user = userEvent.setup()
    renderCard(criarOcorrencia(), true)

    await user.click(screen.getByRole('button', { name: 'Encerrar ocorrência' }))

    expect(await screen.findByText('Selecione a providência tomada.')).toBeInTheDocument()
  })

  it('exige descrição quando a providência é "Outro" e libera o envio quando ela é preenchida', async () => {
    const user = userEvent.setup()
    renderCard(criarOcorrencia(), true)

    await user.selectOptions(screen.getByLabelText('Providência tomada'), 'Outro (descrever abaixo)')
    await user.click(screen.getByRole('button', { name: 'Encerrar ocorrência' }))
    expect(await screen.findByText('Descreva a providência tomada quando selecionar "Outro".')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Descrição do encerramento'), 'Providência efetivamente realizada.')
    await user.click(screen.getByRole('button', { name: 'Encerrar ocorrência' }))

    await waitFor(() => expect(screen.queryByText(/Não foi possível encerrar/)).not.toBeInTheDocument())
    expect(screen.queryByText('Descreva a providência tomada quando selecionar "Outro".')).not.toBeInTheDocument()
  })

  it('permite encerrar com uma providência simples selecionada', async () => {
    const user = userEvent.setup()
    renderCard(criarOcorrencia(), true)

    await user.selectOptions(screen.getByLabelText('Providência tomada'), 'Orientação ao munícipe')
    await user.click(screen.getByRole('button', { name: 'Encerrar ocorrência' }))

    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
  })

  it('não mostra o formulário quando há processo sanitário pendente de resultado', () => {
    renderCard(
      criarOcorrencia({
        processoVinculado: { id: 'p1', protocolo: '045/2026', statusProcesso: 'Aguardando resultado', resultadoPendente: true },
      }),
      true,
    )

    expect(screen.queryByLabelText('Providência tomada')).not.toBeInTheDocument()
    expect(screen.getByText('Disponível após resultado do processo')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Encerrar ocorrência' })).toBeDisabled()
  })

  it('não mostra o formulário quando o perfil não tem permissão para encerrar', () => {
    renderCard(criarOcorrencia(), false)

    expect(screen.queryByLabelText('Providência tomada')).not.toBeInTheDocument()
    expect(screen.getByText('Seu perfil não pode encerrar ocorrências')).toBeInTheDocument()
  })

  it('mostra os dados de encerramento em modo somente-leitura quando a ocorrência já está encerrada', () => {
    renderCard(
      criarOcorrencia({
        statusOcorrencia: 'encerrada',
        providenciaTomada: 'captura_remocao',
        descricaoEncerramento: 'Animal capturado.',
        encerradaEm: '2026-05-12T16:00:00Z',
        movimentacoes: [
          { id: 'm1', tipoMovimentacao: 'encerrada', data: '2026-05-12T16:00:00Z', descricao: null, usuarioNome: 'Stéphanie Lima' },
        ],
      }),
      true,
    )

    expect(screen.queryByLabelText('Providência tomada')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Encerrar ocorrência' })).not.toBeInTheDocument()
    expect(screen.getByText('Captura e remoção do animal')).toBeInTheDocument()
    expect(screen.getByText('Animal capturado.')).toBeInTheDocument()
    expect(screen.getByText('Stéphanie Lima')).toBeInTheDocument()
  })
})
