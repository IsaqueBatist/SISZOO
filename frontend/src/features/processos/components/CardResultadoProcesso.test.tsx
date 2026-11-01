import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { API_BASE_URL } from '@/lib/env'
import { server } from '@/mocks/server'
import { PROCESSO_PENDENTE_ID, processoComResultadoFixture, processoFixture } from '@/mocks/processosFixtures'
import type { Processo } from '../types/processos.types'
import { useProcessoQuery } from '../hooks/useProcessos'
import { CardResultadoProcesso, type AcompanhamentoEnvio } from './CardResultadoProcesso'

// Acompanhamento curto só no teste: o padrão (2 s / 20 s) é para o envio real.
const ACOMPANHAMENTO_RAPIDO: AcompanhamentoEnvio = { intervaloMs: 50, duracaoMs: 400 }

const NAO_NOTIFICADO = 'Munícipe NÃO notificado por e-mail — contatar por outro meio'
const ENVIANDO = 'Enviando a notificação por e-mail ao munícipe…'

// Lê o processo do mesmo cache que a tela usa: o lançamento e o
// acompanhamento do envio atualizam o cache, e o card re-renderiza.
function CardComCache() {
  const { data } = useProcessoQuery(PROCESSO_PENDENTE_ID)
  return data ? (
    <CardResultadoProcesso processo={data} podeEscrever acompanhamentoEnvio={ACOMPANHAMENTO_RAPIDO} />
  ) : null
}

function renderCard() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <CardComCache />
    </QueryClientProvider>,
  )
}

// GET do processo: primeiro `inicial`; depois do lançamento, `depois`.
function servirProcesso(inicial: Processo, depois: () => Processo) {
  let lancado = false
  server.use(
    // "catalogos" casa com :id; sem resposta aqui, segue para o handler padrão.
    http.get(`${API_BASE_URL}/processos/:id`, ({ params }) =>
      params.id === 'catalogos' ? undefined : HttpResponse.json(lancado ? depois() : inicial),
    ),
    http.post(`${API_BASE_URL}/processos/:id/resultados`, () => {
      lancado = true
      // Resposta do POST: positivo gravado, e-mail ainda não enviado (AFTER_COMMIT).
      return HttpResponse.json(processoComResultadoFixture({ dataNotificacaoMunicipe: null, responsavel: inicial.responsavel }))
    }),
  )
}

async function lancarPositivo() {
  const user = userEvent.setup()
  await screen.findByRole('option', { name: 'Positivo' })
  await user.selectOptions(screen.getByLabelText('Resultado laboratorial'), 'positivo')
  await user.click(screen.getByRole('button', { name: 'Preencher com a data de hoje' }))
  await user.click(screen.getByRole('button', { name: 'Registrar resultado' }))
  await user.click(await screen.findByRole('checkbox', { name: 'Entendo que o resultado positivo não poderá ser corrigido' }))
  await user.click(screen.getByRole('button', { name: 'Confirmar' }))
}

describe('CardResultadoProcesso — confirmação do positivo definitivo (T35-15)', () => {
  it('avisa que o positivo é definitivo e só habilita Confirmar com a confirmação explícita', async () => {
    const posts: unknown[] = []
    servirProcesso(processoFixture(), () => processoComResultadoFixture())
    server.use(
      // Ja notificado na resposta: este teste e so da confirmacao, sem acompanhamento do envio.
      http.post(`${API_BASE_URL}/processos/:id/resultados`, async ({ request }) => {
        posts.push(await request.json())
        return HttpResponse.json(processoComResultadoFixture())
      }),
    )
    const user = userEvent.setup()
    renderCard()
    await screen.findByRole('option', { name: 'Positivo' })
    await user.selectOptions(screen.getByLabelText('Resultado laboratorial'), 'positivo')
    await user.click(screen.getByRole('button', { name: 'Preencher com a data de hoje' }))
    await user.click(screen.getByRole('button', { name: 'Registrar resultado' }))

    expect(await screen.findByText('O resultado positivo é definitivo:')).toBeInTheDocument()
    expect(screen.getByText(/não poderá ser corrigido — nem para outro resultado/)).toBeInTheDocument()
    const confirmar = screen.getByRole('button', { name: 'Confirmar' })
    const ciente = screen.getByRole('checkbox', { name: 'Entendo que o resultado positivo não poderá ser corrigido' })
    expect(ciente).not.toBeChecked()
    expect(confirmar).toBeDisabled()

    await user.click(confirmar)
    expect(posts).toHaveLength(0)

    await user.click(ciente)
    expect(confirmar).toBeEnabled()
    await user.click(confirmar)

    expect(await screen.findByText('Positivo', { selector: 'span' })).toBeInTheDocument()
    expect(posts).toEqual([expect.objectContaining({ resultado: 'positivo' })])
  })

  it('cancelar e reabrir: a confirmação volta desmarcada e nada é enviado', async () => {
    const posts: unknown[] = []
    servirProcesso(processoFixture(), () => processoComResultadoFixture())
    server.use(
      http.post(`${API_BASE_URL}/processos/:id/resultados`, async ({ request }) => {
        posts.push(await request.json())
        return HttpResponse.json(processoComResultadoFixture())
      }),
    )
    const user = userEvent.setup()
    renderCard()
    await screen.findByRole('option', { name: 'Positivo' })
    await user.selectOptions(screen.getByLabelText('Resultado laboratorial'), 'positivo')
    await user.click(screen.getByRole('button', { name: 'Preencher com a data de hoje' }))
    await user.click(screen.getByRole('button', { name: 'Registrar resultado' }))
    await user.click(await screen.findByRole('checkbox', { name: 'Entendo que o resultado positivo não poderá ser corrigido' }))
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Registrar resultado' }))
    expect(await screen.findByRole('checkbox', { name: 'Entendo que o resultado positivo não poderá ser corrigido' }))
      .not.toBeChecked()
    expect(screen.getByRole('button', { name: 'Confirmar' })).toBeDisabled()
    expect(posts).toHaveLength(0)
  })

  it('resultado que não é positivo: registra direto, sem a confirmação', async () => {
    servirProcesso(processoFixture(), () => processoComResultadoFixture())
    const user = userEvent.setup()
    renderCard()
    await screen.findByRole('option', { name: 'Negativo' })
    await user.selectOptions(screen.getByLabelText('Resultado laboratorial'), 'negativo')
    await user.click(screen.getByRole('button', { name: 'Preencher com a data de hoje' }))
    await user.click(screen.getByRole('button', { name: 'Registrar resultado' }))

    expect(screen.queryByText('O resultado positivo é definitivo:')).not.toBeInTheDocument()
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
  })
})

describe('CardResultadoProcesso — notificação ao munícipe (T35-16, #37)', () => {
  it('positivo com envio aceito: mostra a data e a hora da notificação', async () => {
    servirProcesso(processoComResultadoFixture(), () => processoComResultadoFixture())
    renderCard()

    expect(await screen.findByText('Munícipe notificado em 20/05/2026 14:32')).toBeInTheDocument()
    expect(screen.queryByText(NAO_NOTIFICADO)).not.toBeInTheDocument()
  })

  it('positivo sem envio aceito (aberto depois): aviso destacado de NÃO notificado', async () => {
    servirProcesso(processoComResultadoFixture({ dataNotificacaoMunicipe: null }), () => processoComResultadoFixture())
    renderCard()

    const aviso = await screen.findByRole('alert')
    expect(aviso).toHaveTextContent(NAO_NOTIFICADO)
    expect(aviso).toHaveClass('danger')
    expect(screen.queryByText(ENVIANDO)).not.toBeInTheDocument()
  })

  it('logo depois de lançar: "enviando" e, quando o envio é aceito, a data da notificação', async () => {
    servirProcesso(processoFixture(), () => processoComResultadoFixture())
    renderCard()

    await lancarPositivo()

    expect(await screen.findByText(ENVIANDO)).toBeInTheDocument()
    expect(screen.queryByText(NAO_NOTIFICADO)).not.toBeInTheDocument()
    expect(await screen.findByText('Munícipe notificado em 20/05/2026 14:32')).toBeInTheDocument()
    expect(screen.queryByText(ENVIANDO)).not.toBeInTheDocument()
  })

  it('logo depois de lançar, sem envio aceito até o fim do prazo: passa a NÃO notificado', async () => {
    servirProcesso(processoFixture(), () => processoComResultadoFixture({ dataNotificacaoMunicipe: null }))
    renderCard()

    await lancarPositivo()

    expect(await screen.findByText(ENVIANDO)).toBeInTheDocument()
    expect(await screen.findByText(NAO_NOTIFICADO)).toBeInTheDocument()
    expect(screen.queryByText(ENVIANDO)).not.toBeInTheDocument()
  })

  it('responsável sem e-mail: NÃO notificado já no lançamento, sem esperar envio', async () => {
    const semEmail = processoFixture()
    semEmail.responsavel = { ...semEmail.responsavel!, email: null }
    servirProcesso(semEmail, () => processoComResultadoFixture({ dataNotificacaoMunicipe: null, responsavel: semEmail.responsavel }))
    renderCard()

    await lancarPositivo()

    expect(await screen.findByText(NAO_NOTIFICADO)).toBeInTheDocument()
    expect(screen.queryByText(ENVIANDO)).not.toBeInTheDocument()
  })

  it('resultado que não é positivo: nenhum aviso de notificação', async () => {
    servirProcesso(
      processoComResultadoFixture({ resultado: { codigo: 'negativo', nome: 'Negativo' }, dataNotificacaoMunicipe: null }),
      () => processoComResultadoFixture(),
    )
    renderCard()

    expect(await screen.findByText('Negativo', { selector: 'span' })).toBeInTheDocument()
    expect(screen.queryByText(NAO_NOTIFICADO)).not.toBeInTheDocument()
    expect(screen.queryByText(/Munícipe notificado/)).not.toBeInTheDocument()
  })
})

describe('CardResultadoProcesso — honestidade e correção', () => {
  it('a data do resultado não vem preenchida, e o atalho usa hoje', async () => {
    servirProcesso(processoFixture(), () => processoComResultadoFixture())
    const user = userEvent.setup()
    renderCard()
    await screen.findByRole('option', { name: 'Positivo' })

    const data = screen.getByLabelText('Data do resultado') as HTMLInputElement
    expect(data.value).toBe('')
    await user.click(screen.getByRole('button', { name: 'Preencher com a data de hoje' }))
    expect(data.value).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('antes de registrar, avisa o que acontece com o e-mail do resultado que notifica', async () => {
    servirProcesso(processoFixture(), () => processoComResultadoFixture())
    const user = userEvent.setup()
    renderCard()
    await screen.findByRole('option', { name: 'Inconclusivo' })

    await user.selectOptions(screen.getByLabelText('Resultado laboratorial'), 'inconclusivo')

    expect(screen.getByRole('status')).toHaveTextContent(/enviará um e-mail para|não tem e-mail cadastrado/)
  })

  it('o positivo diz que a Vigilância não é avisada pelo sistema', async () => {
    servirProcesso(processoComResultadoFixture(), () => processoComResultadoFixture())
    renderCard()

    expect(await screen.findByText(/A Vigilância Epidemiológica de Itu não é avisada pelo SISZOO/)).toBeInTheDocument()
  })

  it('positivo não oferece correção', async () => {
    servirProcesso(processoComResultadoFixture({ statusProcesso: 'COM_RESULTADO' }), () => processoComResultadoFixture())
    renderCard()

    await screen.findByText('Histórico')
    expect(screen.queryByRole('button', { name: 'Corrigir resultado' })).not.toBeInTheDocument()
  })

  it('corrige resultado não definitivo exigindo motivo e apontando para o registro corrigido', async () => {
    const vigente = {
      id: 'r1000000-0000-0000-0000-000000000001',
      resultado: { codigo: 'negativo', nome: 'Negativo' },
      dataResultado: '2026-10-01',
      observacoes: null,
      retificaId: null,
      registradoPorId: 'u1',
      registradoPorNome: 'Ana Silva',
      registradoEm: '2026-10-01T10:00:00',
    }
    const negativo = processoComResultadoFixture({
      statusProcesso: 'COM_RESULTADO',
      resultado: vigente.resultado,
      resultados: [vigente],
      dataNotificacaoMunicipe: null,
    })
    const corpos: unknown[] = []
    server.use(
      http.get(`${API_BASE_URL}/processos/:id`, ({ params }) => (params.id === 'catalogos' ? undefined : HttpResponse.json(negativo))),
      http.post(`${API_BASE_URL}/processos/:id/resultados`, async ({ request }) => {
        corpos.push(await request.json())
        return HttpResponse.json(negativo)
      }),
    )
    const user = userEvent.setup()
    renderCard()

    await user.click(await screen.findByRole('button', { name: 'Corrigir resultado' }))
    await screen.findByRole('option', { name: 'Inconclusivo' })
    await user.selectOptions(screen.getByLabelText('Resultado laboratorial'), 'inconclusivo')
    await user.click(screen.getByRole('button', { name: 'Preencher com a data de hoje' }))
    await user.click(screen.getByRole('button', { name: 'Salvar correção' }))

    expect(await screen.findByText('Informe o motivo da correção.')).toBeInTheDocument()
    expect(corpos).toHaveLength(0)

    await user.type(screen.getByLabelText(/Motivo da correção/), 'Digitado errado')
    await user.click(screen.getByRole('button', { name: 'Salvar correção' }))

    await waitFor(() => expect(corpos).toHaveLength(1))
    expect(corpos[0]).toMatchObject({ retificaId: vigente.id, observacoes: 'Digitado errado' })
  })
})
