import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AuthProvider, SESSION_STORAGE_KEY } from '@/features/auth/hooks/AuthContext'
import type { Usuario } from '@/features/auth/types/auth.types'
import { API_BASE_URL } from '@/lib/env'
import { server } from '@/mocks/server'
import { OCORRENCIA_ABERTA_ID, OCORRENCIA_PROCESSO_PENDENTE_ID, ocorrenciaAbertaFixture } from '@/mocks/ocorrenciasFixtures'
import {
  ANIMAL_AMOSTRADO_ID,
  PROCESSO_PENDENTE_ID,
  PROCESSO_SEM_VINCULO_ID,
  processoComResultadoFixture,
  processoFixture,
  processoSemVinculoFixture,
} from '@/mocks/processosFixtures'
import { ProcessoDetalhe } from './ProcessoDetalhe'

const ADMIN = ['Administrador']
const AGENTE = ['Agente Sanitário']
const VET = ['Veterinário']

function renderDetalhe(id: string, cargos = ADMIN) {
  const usuario: Usuario = {
    id: 'a1b2c3d4-0000-0000-0000-000000000099',
    nome: 'Ana',
    sobrenome: 'Silva',
    email: 'ana.silva@itu.sp.gov.br',
    cargos,
    senhaAlteradaEm: '2026-01-10T12:00:00Z',
  }
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ token: 'token-existente', usuario }))
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/processos/${id}`]}>
        <AuthProvider>
          <Routes>
            <Route path="/processos/:id" element={<ProcessoDetalhe />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

async function esperarDetalhe(protocolo: string) {
  await screen.findByRole('heading', { name: `Processo PS ${protocolo}`, level: 1 })
}

function cardDe(titulo: string) {
  return within(screen.getByRole('heading', { name: titulo }).closest('.card') as HTMLElement)
}

describe('ProcessoDetalhe — dados', () => {
  it('mostra os dados do processo, o responsável e a amostra com identificação, campos clínicos e sintomas', async () => {
    renderDetalhe(PROCESSO_PENDENTE_ID)
    await esperarDetalhe('045/2026')

    const dados = cardDe('Dados do Processo')
    expect(dados.getByText('A82')).toBeInTheDocument()
    expect(dados.getByText('Pasteur — SP')).toBeInTheDocument()
    expect(dados.getByText('18/05/2026')).toBeInTheDocument()
    expect(dados.getByText('Animal recolhido em via pública')).toBeInTheDocument()

    const responsavel = cardDe('Responsável / Munícipe')
    for (const valor of ['Maria da Conceição', '123.456.789-00', '(11) 99999-0000', 'maria@exemplo.com', '13300-000',
      'Rua das Flores, 10', 'Centro', 'Vila Nova']) {
      expect(responsavel.getByText(valor)).toBeInTheDocument()
    }

    const amostra = cardDe('Amostra 1')
    for (const valor of ['Canino', 'Macho', 'SRD', 'Caramelo', 'Curta', '3 anos', '12.50', 'Sintomático', 'Peridomiciliar',
      'Tecido encefálico', 'Agressividade sem motivo aparente', 'Apatia, Coriza', 'Coleta pós-óbito']) {
      expect(amostra.getByText(valor)).toBeInTheDocument()
    }
    expect(amostra.getByText(/contato direta/)).toBeInTheDocument()
    expect(amostra.getByText(/O animal agrediu o munícipe/)).toBeInTheDocument()
    expect(amostra.getByText('Animal de campo')).toBeInTheDocument()
  })

  it('amostra do canil leva à ficha do animal e não tem contato registrado', async () => {
    renderDetalhe(PROCESSO_SEM_VINCULO_ID)
    await esperarDetalhe('046/2026')

    const amostra = cardDe('Amostra 1')
    expect(amostra.getByRole('link', { name: 'Ver ficha do animal' })).toHaveAttribute('href', `/animais/${ANIMAL_AMOSTRADO_ID}`)
    expect(amostra.getByText('Sem contato humano-animal registrado nesta amostra.')).toBeInTheDocument()
  })

  it('processo urgente mostra o banner de contato humano-animal', async () => {
    renderDetalhe(PROCESSO_PENDENTE_ID)
    await esperarDetalhe('045/2026')
    expect(screen.getByText(/Atenção — contato humano-animal confirmado/)).toBeInTheDocument()
  })

  it('processo não urgente não mostra o banner', async () => {
    renderDetalhe(PROCESSO_SEM_VINCULO_ID)
    await esperarDetalhe('046/2026')
    expect(screen.queryByText(/Atenção — contato humano-animal confirmado/)).not.toBeInTheDocument()
  })

  it('não oferece ações sem backend (enviar amostras, documentos) nem aviso de demonstração', async () => {
    renderDetalhe(PROCESSO_PENDENTE_ID)
    await esperarDetalhe('045/2026')

    expect(screen.queryByRole('button', { name: /Enviar amostras/ })).not.toBeInTheDocument()
    expect(screen.queryByText(/Documentos/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Dados de demonstração/)).not.toBeInTheDocument()
  })

  it('id inexistente (404) mostra "não encontrado"', async () => {
    renderDetalhe('00000000-0000-0000-0000-000000000000')

    expect(await screen.findByText('Processo sanitário não encontrado.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '← Voltar para Processos' })).toBeInTheDocument()
  })

  it('falha do servidor mostra erro genérico, não "não encontrado"', async () => {
    server.use(http.get(`${API_BASE_URL}/processos/:id`, () => HttpResponse.json({ mensagem: 'erro' }, { status: 500 })))
    renderDetalhe(PROCESSO_PENDENTE_ID)

    expect(await screen.findByText('Não foi possível carregar este processo sanitário. Tente novamente.')).toBeInTheDocument()
  })
})

describe('ProcessoDetalhe — ocorrência vinculada', () => {
  it.each([
    ['Administrador', ADMIN],
    ['Agente Sanitário', AGENTE],
  ])('%s vê o protocolo da ocorrência e o link para ela, sem dados do denunciante', async (_perfil, cargos) => {
    renderDetalhe(PROCESSO_PENDENTE_ID, cargos)
    await esperarDetalhe('045/2026')

    const card = cardDe('Ocorrência Vinculada')
    expect(card.getByText('OC 092/2026')).toBeInTheDocument()
    expect(card.getByRole('link', { name: 'Ver ocorrência' })).toHaveAttribute('href', `/ocorrencias/${OCORRENCIA_PROCESSO_PENDENTE_ID}`)
    expect(card.getByText('O vínculo com a ocorrência não pode ser alterado.')).toBeInTheDocument()
    expect(card.queryByText(/Denunciante/)).not.toBeInTheDocument()
  })

  it('Veterinário vê o protocolo, mas sem link para a ocorrência (sem acesso ao módulo, V11)', async () => {
    renderDetalhe(PROCESSO_PENDENTE_ID, VET)
    await esperarDetalhe('045/2026')

    const card = cardDe('Ocorrência Vinculada')
    expect(card.getByText('OC 092/2026')).toBeInTheDocument()
    expect(card.queryByRole('link', { name: 'Ver ocorrência' })).not.toBeInTheDocument()
    // Nenhum link da página leva ao módulo de ocorrências.
    const destinos = screen.getAllByRole('link').map((link) => link.getAttribute('href') ?? '')
    expect(destinos.filter((href) => href.startsWith('/ocorrencias'))).toEqual([])
  })

  it('Veterinário não recebe a opção de vínculo posterior (exige escrita em ocorrências, D33)', async () => {
    renderDetalhe(PROCESSO_SEM_VINCULO_ID, VET)
    await esperarDetalhe('046/2026')

    expect(screen.getByText('Este processo não está vinculado a nenhuma ocorrência.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Vincular uma ocorrência já cadastrada' })).not.toBeInTheDocument()
  })

  it('Agente vincula uma ocorrência já cadastrada: envia o processoId ao endpoint da ocorrência e recarrega o processo', async () => {
    const corpos: unknown[] = []
    let vinculado = false
    server.use(
      http.post(`${API_BASE_URL}/ocorrencias/:id/processo`, async ({ params, request }) => {
        expect(params.id).toBe(OCORRENCIA_ABERTA_ID)
        corpos.push(await request.json())
        vinculado = true
        return HttpResponse.json(ocorrenciaAbertaFixture())
      }),
      http.get(`${API_BASE_URL}/processos/:id`, () =>
        HttpResponse.json(
          vinculado
            ? { ...processoSemVinculoFixture(), ocorrenciaId: OCORRENCIA_ABERTA_ID, ocorrenciaProtocolo: '089/2026' }
            : processoSemVinculoFixture(),
        ),
      ),
    )
    const user = userEvent.setup()
    renderDetalhe(PROCESSO_SEM_VINCULO_ID, AGENTE)
    await esperarDetalhe('046/2026')

    await user.click(screen.getByRole('button', { name: 'Vincular uma ocorrência já cadastrada' }))
    await user.click(await screen.findByText('OC 089/2026'))

    expect(await cardDe('Ocorrência Vinculada').findByText('O vínculo com a ocorrência não pode ser alterado.')).toBeInTheDocument()
    expect(cardDe('Ocorrência Vinculada').getByText('OC 089/2026')).toBeInTheDocument()
    expect(corpos).toEqual([{ processoId: PROCESSO_SEM_VINCULO_ID }])
  })

  it('vínculo recusado (409) mostra a mensagem do servidor e mantém a escolha aberta', async () => {
    server.use(
      http.post(`${API_BASE_URL}/ocorrencias/:id/processo`, () =>
        HttpResponse.json({ mensagem: 'Ocorrencia ou processo ja possui vinculo' }, { status: 409 }),
      ),
    )
    const user = userEvent.setup()
    renderDetalhe(PROCESSO_SEM_VINCULO_ID, ADMIN)
    await esperarDetalhe('046/2026')

    await user.click(screen.getByRole('button', { name: 'Vincular uma ocorrência já cadastrada' }))
    await user.click(await screen.findByText('OC 089/2026'))

    expect(await screen.findByText('Ocorrencia ou processo ja possui vinculo')).toBeInTheDocument()
    expect(screen.getByRole('radiogroup', { name: 'Ocorrências disponíveis para vínculo' })).toBeInTheDocument()
  })
})

describe('ProcessoDetalhe — status (provisório, D18)', () => {
  // T37: a transição AGUARDANDO_RESULTADO -> COM_RESULTADO saiu deste botão
  // (vai só pelo lançamento do resultado agora) — estes testes usam
  // ABERTO -> AGUARDANDO_RESULTADO, que continua provisória.
  it.each([
    ['Administrador', ADMIN],
    ['Agente Sanitário', AGENTE],
    ['Veterinário', VET],
  ])('%s avança um passo e a tela mostra o status devolvido pela API', async (_perfil, cargos) => {
    const corpos: unknown[] = []
    server.use(
      http.patch(`${API_BASE_URL}/processos/:id/status`, async ({ request }) => {
        corpos.push(await request.json())
        return HttpResponse.json(processoSemVinculoFixture({ statusProcesso: 'AGUARDANDO_RESULTADO' }))
      }),
    )
    const user = userEvent.setup()
    renderDetalhe(PROCESSO_SEM_VINCULO_ID, cargos)
    await esperarDetalhe('046/2026')
    expect(cardDe('Status do processo').getByText('Aberto')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Avançar status do processo (provisório)' }))

    expect(await cardDe('Status do processo').findByText('Aguardando resultado')).toBeInTheDocument()
    expect(corpos).toEqual([{ status: 'AGUARDANDO_RESULTADO' }])
  })

  it('transição recusada (422) mostra a mensagem do servidor', async () => {
    server.use(
      http.patch(`${API_BASE_URL}/processos/:id/status`, () =>
        HttpResponse.json({ mensagem: 'Transicao de status nao permitida para o processo' }, { status: 422 }),
      ),
    )
    const user = userEvent.setup()
    renderDetalhe(PROCESSO_SEM_VINCULO_ID)
    await esperarDetalhe('046/2026')

    await user.click(screen.getByRole('button', { name: 'Avançar status do processo (provisório)' }))

    expect(await screen.findByText('Transicao de status nao permitida para o processo')).toBeInTheDocument()
  })

  it('o botão fica desabilitado enquanto o avanço está em andamento (sem envio duplicado)', async () => {
    let chamadas = 0
    let liberar: () => void = () => {}
    server.use(
      http.patch(`${API_BASE_URL}/processos/:id/status`, async () => {
        chamadas += 1
        await new Promise<void>((resolve) => {
          liberar = resolve
        })
        return HttpResponse.json(processoSemVinculoFixture({ statusProcesso: 'AGUARDANDO_RESULTADO' }))
      }),
    )
    const user = userEvent.setup()
    renderDetalhe(PROCESSO_SEM_VINCULO_ID)
    await esperarDetalhe('046/2026')

    await user.click(screen.getByRole('button', { name: 'Avançar status do processo (provisório)' }))
    const emAndamento = await screen.findByRole('button', { name: 'Avançando…' })
    expect(emAndamento).toBeDisabled()
    await user.click(emAndamento)
    liberar()

    expect(await cardDe('Status do processo').findByText('Aguardando resultado')).toBeInTheDocument()
    await waitFor(() => expect(chamadas).toBe(1))
  })

  it('processo concluído não oferece avanço', async () => {
    server.use(http.get(`${API_BASE_URL}/processos/:id`, () => HttpResponse.json(processoFixture({ statusProcesso: 'CONCLUIDO' }))))
    renderDetalhe(PROCESSO_PENDENTE_ID)
    await esperarDetalhe('045/2026')

    expect(cardDe('Status do processo').getByText('Processo concluído.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Avançar status do processo (provisório)' })).not.toBeInTheDocument()
  })

  it('AGUARDANDO_RESULTADO não oferece o avanço provisório: só o lançamento do resultado avança', async () => {
    renderDetalhe(PROCESSO_PENDENTE_ID)
    await esperarDetalhe('045/2026')

    expect(cardDe('Status do processo').getByText('Aguardando resultado')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Avançar status do processo (provisório)' })).not.toBeInTheDocument()
    expect(
      cardDe('Status do processo').getByText('Lance o resultado laboratorial no card ao lado para avançar este processo.'),
    ).toBeInTheDocument()
  })
})

// O catálogo (GET /processos/catalogos) é uma query separada da do
// processo — esperarDetalhe só garante que o processo carregou, não que o
// <select> já tem as opções do catálogo.
async function aguardarOpcoesDeResultado() {
  await screen.findByRole('option', { name: 'Positivo' })
}

describe('ProcessoDetalhe — resultado laboratorial (T37)', () => {
  it('status ABERTO: aguarda envio das amostras, sem formulário de resultado', async () => {
    renderDetalhe(PROCESSO_SEM_VINCULO_ID)
    await esperarDetalhe('046/2026')

    expect(cardDe('Resultado Laboratorial').getByText('Aguardando o envio das amostras ao laboratório.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Registrar resultado' })).not.toBeInTheDocument()
  })

  it.each([
    ['Administrador', ADMIN],
    ['Agente Sanitário', AGENTE],
    ['Veterinário', VET],
  ])('%s vê o formulário de resultado quando AGUARDANDO_RESULTADO, com opções vindas do catálogo', async (_perfil, cargos) => {
    renderDetalhe(PROCESSO_PENDENTE_ID, cargos)
    await esperarDetalhe('045/2026')

    const select = await screen.findByLabelText('Resultado laboratorial')
    const opcoes = within(select).getAllByRole('option').map((opcao) => opcao.textContent)
    // "Aguardando" não é uma opção de lançamento (R1) — vem do catálogo, sem
    // ser hardcoded no front.
    expect(opcoes).toEqual(['Selecione...', 'Positivo', 'Negativo', 'Inconclusivo', 'Material Inadequado', 'Não Realizado'])
  })

  it('resultado negativo: sem confirmação, registra direto e mostra o modo somente-leitura com histórico', async () => {
    const user = userEvent.setup()
    renderDetalhe(PROCESSO_PENDENTE_ID, AGENTE)
    await esperarDetalhe('045/2026')
    await aguardarOpcoesDeResultado()

    await user.selectOptions(screen.getByLabelText('Resultado laboratorial'), 'negativo')
    await user.click(screen.getByRole('button', { name: 'Registrar resultado' }))

    expect(screen.queryByText('Confirmar lançamento do resultado')).not.toBeInTheDocument()
    expect(await cardDe('Resultado Laboratorial').findByText('Negativo', { selector: 'span' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Registrar resultado' })).not.toBeInTheDocument()
    expect(await cardDe('Resultado Laboratorial').findByText(/Lançado/)).toBeInTheDocument()
    expect(cardDe('Resultado Laboratorial').getByText(/registrado por Agente Processos/)).toBeInTheDocument()
  })

  it('resultado positivo: mostra confirmação antes de enviar e o envio da notificação em andamento depois', async () => {
    const user = userEvent.setup()
    renderDetalhe(PROCESSO_PENDENTE_ID, AGENTE)
    await esperarDetalhe('045/2026')
    await aguardarOpcoesDeResultado()

    await user.selectOptions(screen.getByLabelText('Resultado laboratorial'), 'positivo')
    await user.click(screen.getByRole('button', { name: 'Registrar resultado' }))

    expect(await screen.findByText('Confirmar lançamento do resultado')).toBeInTheDocument()
    // T35-15: positivo é definitivo, confirmação explícita antes de enviar.
    await user.click(screen.getByRole('checkbox', { name: 'Entendo que o resultado positivo não poderá ser corrigido' }))
    await user.click(screen.getByRole('button', { name: 'Confirmar' }))

    // T35-16: o e-mail sai depois do commit; os estados seguintes do aviso
    // (notificado / NÃO notificado) estão em CardResultadoProcesso.test.tsx.
    expect(
      await cardDe('Resultado Laboratorial').findByText('Enviando a notificação por e-mail ao munícipe…'),
    ).toBeInTheDocument()
  })

  // Revisão de 2026-10-17 (regra 19, DER): inconclusivo deixou de notificar
  // — registra direto, sem confirmação nem aviso de notificação.
  it('resultado inconclusivo: NÃO notifica mais — sem confirmação, registra direto', async () => {
    const user = userEvent.setup()
    renderDetalhe(PROCESSO_PENDENTE_ID, AGENTE)
    await esperarDetalhe('045/2026')
    await aguardarOpcoesDeResultado()

    await user.selectOptions(screen.getByLabelText('Resultado laboratorial'), 'inconclusivo')
    await user.click(screen.getByRole('button', { name: 'Registrar resultado' }))

    expect(screen.queryByText('Confirmar lançamento do resultado')).not.toBeInTheDocument()
    expect(await cardDe('Resultado Laboratorial').findByText('Inconclusivo', { selector: 'span' })).toBeInTheDocument()
    expect(cardDe('Resultado Laboratorial').queryByText(/notifica/i)).not.toBeInTheDocument()
  })

  it('confirmação de positivo pode ser cancelada sem enviar nada', async () => {
    const user = userEvent.setup()
    renderDetalhe(PROCESSO_PENDENTE_ID, AGENTE)
    await esperarDetalhe('045/2026')
    await aguardarOpcoesDeResultado()

    await user.selectOptions(screen.getByLabelText('Resultado laboratorial'), 'positivo')
    await user.click(screen.getByRole('button', { name: 'Registrar resultado' }))
    await screen.findByText('Confirmar lançamento do resultado')
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(screen.queryByText('Confirmar lançamento do resultado')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Registrar resultado' })).toBeInTheDocument()
  })

  // T34-5 (docs/decisoes/T34.md): sem limite inferior — o laudo pode
  // anteceder a abertura do processo (aberto em 2026-05-18 na fixture).
  it('data do resultado anterior à abertura: campo sem min e lançamento enviado com essa data', async () => {
    const corpos: unknown[] = []
    server.use(
      http.post(`${API_BASE_URL}/processos/:id/resultados`, async ({ request }) => {
        corpos.push(await request.json())
        return HttpResponse.json(processoComResultadoFixture())
      }),
    )
    const user = userEvent.setup()
    renderDetalhe(PROCESSO_PENDENTE_ID, AGENTE)
    await esperarDetalhe('045/2026')
    await aguardarOpcoesDeResultado()

    const data = screen.getByLabelText('Data do resultado') as HTMLInputElement
    expect(data).not.toHaveAttribute('min')
    fireEvent.change(data, { target: { value: '2026-05-10' } })
    await user.selectOptions(screen.getByLabelText('Resultado laboratorial'), 'negativo')
    await user.click(screen.getByRole('button', { name: 'Registrar resultado' }))

    await waitFor(() => expect(corpos).toHaveLength(1))
    expect(corpos[0]).toMatchObject({ resultado: 'negativo', dataResultado: '2026-05-10' })
  })

  it('falha de rede preserva o resultado selecionado e mostra mensagem de tentar de novo', async () => {
    server.use(http.post(`${API_BASE_URL}/processos/:id/resultados`, () => HttpResponse.error()))
    const user = userEvent.setup()
    renderDetalhe(PROCESSO_PENDENTE_ID, AGENTE)
    await esperarDetalhe('045/2026')
    await aguardarOpcoesDeResultado()

    const select = screen.getByLabelText('Resultado laboratorial') as HTMLSelectElement
    await user.selectOptions(select, 'negativo')
    await user.click(screen.getByRole('button', { name: 'Registrar resultado' }))

    expect(await screen.findByText('Não foi possível registrar o resultado. Tente novamente.')).toBeInTheDocument()
    expect(select.value).toBe('negativo')
    expect(screen.getByRole('button', { name: 'Registrar resultado' })).toBeInTheDocument()
  })

  it('depois de lançado, o resultado é somente leitura (sem formulário) mesmo recarregando o processo', async () => {
    server.use(http.get(`${API_BASE_URL}/processos/:id`, () => HttpResponse.json(processoComResultadoFixture())))
    renderDetalhe(PROCESSO_PENDENTE_ID)
    await esperarDetalhe('045/2026')

    expect(cardDe('Resultado Laboratorial').getByText('Positivo', { selector: 'span' })).toBeInTheDocument()
    expect(cardDe('Resultado Laboratorial').getByText('Óbito — Eutanásia')).toBeInTheDocument()
    expect(screen.queryByLabelText('Resultado laboratorial')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Registrar resultado' })).not.toBeInTheDocument()
  })
})
