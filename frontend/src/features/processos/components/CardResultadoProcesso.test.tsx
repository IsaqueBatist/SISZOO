import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
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
  await user.click(screen.getByRole('button', { name: 'Registrar resultado' }))
  await user.click(await screen.findByRole('button', { name: 'Confirmar' }))
}

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
