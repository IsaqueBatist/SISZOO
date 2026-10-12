import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AuthProvider, SESSION_STORAGE_KEY } from '@/features/auth/hooks/AuthContext'
import type { Usuario } from '@/features/auth/types/auth.types'
import { API_BASE_URL } from '@/lib/env'
import { server } from '@/mocks/server'
import { CATALOGOS_OCORRENCIA_FIXTURE, criarOcorrenciaFixture } from '@/mocks/ocorrenciasFixtures'
import { CardEncerramento } from './CardEncerramento'
import type { Ocorrencia, ProcessoVinculado } from '../types/ocorrencias.types'

// O POST de encerramento e o GET /ocorrencias/catalogos caem nos handlers
// fixos de ../../../mocks/ocorrenciasHandlers.ts.
function criarOcorrencia(sobrescrever: Partial<Ocorrencia> = {}): Ocorrencia {
  return criarOcorrenciaFixture(sobrescrever)
}

function processo(statusProcesso: ProcessoVinculado['statusProcesso']): ProcessoVinculado {
  return { id: 'p1', protocolo: '045/2026', statusProcesso, urgente: false }
}

function renderCard(ocorrencia: Ocorrencia, podeEncerrar: boolean) {
  const usuario: Usuario = {
    id: 'a1b2c3d4-0000-0000-0000-000000000001',
    nome: 'Stéphanie',
    sobrenome: 'Lima',
    email: 'stephanie.lima@itu.sp.gov.br',
    cargos: ['Administrador'],
    senhaAlteradaEm: '2026-01-10T12:00:00Z',
  }
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ token: 'token-existente', usuario }))

  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AuthProvider>
          <CardEncerramento ocorrencia={ocorrencia} podeEncerrar={podeEncerrar} />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

// As opções vêm do catálogo (assíncrono): espera o select habilitar.
async function codigosDasOpcoes(): Promise<string[]> {
  const select = screen.getByLabelText('Providência tomada') as HTMLSelectElement
  await waitFor(() => expect(select).toBeEnabled())
  return Array.from(select.options)
    .filter((opcao) => opcao.value !== '')
    .map((opcao) => opcao.value)
}

describe('CardEncerramento', () => {
  it('bloqueia o envio quando nenhuma providência é selecionada', async () => {
    const user = userEvent.setup()
    renderCard(criarOcorrencia(), true)

    await codigosDasOpcoes()
    await user.click(screen.getByRole('button', { name: 'Encerrar ocorrência' }))

    expect(await screen.findByText('Selecione a providência tomada.')).toBeInTheDocument()
  })

  it('exige descrição quando a providência é "Outro" e libera o envio quando ela é preenchida', async () => {
    const user = userEvent.setup()
    renderCard(criarOcorrencia({ statusOcorrencia: 'EM_ATENDIMENTO' }), true)

    await codigosDasOpcoes()
    await user.selectOptions(screen.getByLabelText('Providência tomada'), 'Outro')
    await user.click(screen.getByRole('button', { name: 'Encerrar ocorrência' }))
    expect(await screen.findByText('Descreva a providência tomada quando selecionar "Outro".')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Descrição do encerramento'), 'Providência efetivamente realizada.')
    await user.click(screen.getByRole('button', { name: 'Encerrar ocorrência' }))

    await waitFor(() => expect(screen.queryByText(/Não foi possível encerrar/)).not.toBeInTheDocument())
    expect(screen.queryByText('Descreva a providência tomada quando selecionar "Outro".')).not.toBeInTheDocument()
  })

  it('em ocorrência ABERTA, só oferece as providências de encerramento direto (D5)', async () => {
    renderCard(criarOcorrencia({ statusOcorrencia: 'ABERTA' }), true)

    expect(await codigosDasOpcoes()).toEqual(['orientacao_municipe', 'sem_acao', 'registro_indevido'])
  })

  it('em ocorrência EM_ATENDIMENTO, oferece todas as providências do catálogo, inclusive "Registro duplicado/indevido" (D34)', async () => {
    renderCard(criarOcorrencia({ statusOcorrencia: 'EM_ATENDIMENTO' }), true)

    expect(await codigosDasOpcoes()).toEqual([
      'orientacao_municipe',
      'encaminhamento_gepar',
      'abertura_processo',
      'captura_remocao',
      'sem_acao',
      'outro',
      'registro_indevido',
    ])
  })

  it('permite encerrar com uma providência simples selecionada', async () => {
    const user = userEvent.setup()
    renderCard(criarOcorrencia(), true)

    await codigosDasOpcoes()
    await user.selectOptions(screen.getByLabelText('Providência tomada'), 'Orientação ao munícipe')
    await user.click(screen.getByRole('button', { name: 'Encerrar ocorrência' }))

    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
  })

  it('usa os nomes do catálogo do backend nas opções', async () => {
    renderCard(criarOcorrencia({ statusOcorrencia: 'EM_ATENDIMENTO' }), true)

    await codigosDasOpcoes()
    expect(screen.getByRole('option', { name: 'Captura e remoção' })).toHaveValue('captura_remocao')
  })

  it('enquanto o catálogo carrega, o select e o botão ficam desabilitados', () => {
    renderCard(criarOcorrencia(), true)

    expect(screen.getByLabelText('Providência tomada')).toBeDisabled()
    expect(screen.getByRole('option', { name: 'Carregando…' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Encerrar ocorrência' })).toBeDisabled()
  })

  it('catálogo com erro: mostra o aviso, não libera o encerramento e "Tentar novamente" recarrega', async () => {
    const user = userEvent.setup()
    let disponivel = false
    server.use(
      http.get(`${API_BASE_URL}/ocorrencias/catalogos`, () =>
        disponivel
          ? HttpResponse.json(CATALOGOS_OCORRENCIA_FIXTURE)
          : new HttpResponse(null, { status: 503 }),
      ),
    )
    renderCard(criarOcorrencia(), true)

    expect(await screen.findByText('Não foi possível carregar a lista de providências.')).toBeInTheDocument()
    expect(screen.getByLabelText('Providência tomada')).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Encerrar ocorrência' })).toBeDisabled()

    disponivel = true
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(await codigosDasOpcoes()).toEqual(['orientacao_municipe', 'sem_acao', 'registro_indevido'])
    expect(screen.queryByText('Não foi possível carregar a lista de providências.')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Encerrar ocorrência' })).toBeEnabled()
  })

  it('catálogo sem providências: trata como indisponível, sem liberar o encerramento', async () => {
    server.use(
      http.get(`${API_BASE_URL}/ocorrencias/catalogos`, () =>
        HttpResponse.json({ ...CATALOGOS_OCORRENCIA_FIXTURE, providencias: [] }),
      ),
    )
    renderCard(criarOcorrencia(), true)

    expect(await screen.findByText('Não foi possível carregar a lista de providências.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Encerrar ocorrência' })).toBeDisabled()
  })

  it.each(['ABERTO', 'AGUARDANDO_RESULTADO', 'COM_RESULTADO'] as const)(
    'não mostra o formulário quando o processo vinculado está %s, ainda não concluído (D12)',
    (statusProcesso) => {
      renderCard(criarOcorrencia({ statusOcorrencia: 'EM_ATENDIMENTO', processoVinculado: processo(statusProcesso) }), true)

      expect(screen.queryByLabelText('Providência tomada')).not.toBeInTheDocument()
      expect(screen.getByText('Disponível após a conclusão do processo')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Encerrar ocorrência' })).toBeDisabled()
    },
  )

  it('libera o formulário quando o processo vinculado está CONCLUIDO', () => {
    renderCard(criarOcorrencia({ statusOcorrencia: 'EM_ATENDIMENTO', processoVinculado: processo('CONCLUIDO') }), true)

    expect(screen.getByLabelText('Providência tomada')).toBeInTheDocument()
  })

  it('não mostra o formulário quando o perfil não tem permissão para encerrar', () => {
    renderCard(criarOcorrencia(), false)

    expect(screen.queryByLabelText('Providência tomada')).not.toBeInTheDocument()
    expect(screen.getByText('Seu perfil não pode encerrar ocorrências')).toBeInTheDocument()
  })

  it('mostra os dados de encerramento em modo somente-leitura quando a ocorrência já está encerrada', () => {
    renderCard(
      criarOcorrencia({
        statusOcorrencia: 'ENCERRADA',
        providenciaTomada: 'captura_remocao',
        providenciaTomadaNome: 'Captura e remoção',
        descricaoEncerramento: 'Animal capturado.',
        encerradaEm: '2026-05-12T13:00:00.004432',
        encerradaPorNome: 'Stéphanie Lima',
      }),
      true,
    )

    expect(screen.queryByLabelText('Providência tomada')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Encerrar ocorrência' })).not.toBeInTheDocument()
    expect(screen.getByText('Captura e remoção')).toBeInTheDocument()
    expect(screen.getByText('Animal capturado.')).toBeInTheDocument()
    expect(screen.getByText('12/05/2026')).toBeInTheDocument()
    expect(screen.getByText('Stéphanie Lima')).toBeInTheDocument()
  })
})
