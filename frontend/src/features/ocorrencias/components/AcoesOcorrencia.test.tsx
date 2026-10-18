import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AuthProvider, SESSION_STORAGE_KEY } from '@/features/auth/hooks/AuthContext'
import type { Usuario } from '@/features/auth/types/auth.types'
import { API_BASE_URL } from '@/lib/env'
import { server } from '@/mocks/server'
import {
  OCORRENCIA_ABERTA_ID,
  OCORRENCIA_ENCERRADA_ID,
  OCORRENCIA_PROCESSO_PENDENTE_ID,
  PROCESSO_CRIADO_FIXTURE,
  PROCESSO_PENDENTE_ID,
  ocorrenciaAbertaFixture,
  ocorrenciaProcessoPendente,
} from '@/mocks/ocorrenciasFixtures'
import type { Ocorrencia, StatusProcesso } from '../types/ocorrencias.types'
import { CadastrarProcesso } from '@/features/processos/components/CadastrarProcesso'
import { OcorrenciaDetalhe } from './OcorrenciaDetalhe'

const ADMIN = ['Administrador']
const AGENTE = ['Agente Sanitário']
const VET = ['Veterinário']

function renderDetalhe(ocorrenciaId: string, cargos: string[]) {
  const usuario: Usuario = {
    id: 'a1b2c3d4-0000-0000-0000-000000000099',
    nome: 'Usuária',
    sobrenome: 'Teste',
    email: 'usuaria.teste@itu.sp.gov.br',
    cargos,
    senhaAlteradaEm: '2026-01-10T12:00:00Z',
  }
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ token: 'token-existente', usuario }))

  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/ocorrencias/${ocorrenciaId}`]}>
        <AuthProvider>
          <Routes>
            <Route path="/ocorrencias/:id" element={<OcorrenciaDetalhe />} />
            <Route path="/processos/novo" element={<CadastrarProcesso />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

async function esperarDetalhe(protocolo: string) {
  await screen.findByRole('heading', { name: `Ocorrência OC ${protocolo}`, level: 1 })
}

function comStatusProcesso(statusProcesso: StatusProcesso): Ocorrencia {
  const ocorrencia = ocorrenciaProcessoPendente()
  return { ...ocorrencia, processoVinculado: { ...ocorrencia.processoVinculado!, statusProcesso } }
}

describe('nota interna (D37)', () => {
  it('adiciona a nota: envia a descrição, mostra a movimentação devolvida e limpa o campo', async () => {
    const user = userEvent.setup()
    const corpos: unknown[] = []
    server.use(
      http.post(`${API_BASE_URL}/ocorrencias/${OCORRENCIA_ABERTA_ID}/notas`, async ({ request }) => {
        corpos.push(await request.json())
        const aberta = ocorrenciaAbertaFixture()
        return HttpResponse.json(
          {
            ...aberta,
            movimentacoes: [
              ...aberta.movimentacoes,
              {
                id: 'h6000000-0000-0000-0000-000000000096',
                tipoMovimentacao: 'NOTA_INTERNA',
                statusAnterior: null,
                statusNovo: null,
                data: '2026-05-20T11:10:00',
                descricao: 'Morador ausente na primeira visita.',
                usuarioId: 'a1b2c3d4-0000-0000-0000-000000000099',
                usuarioNome: 'Usuária Teste',
              },
            ],
          },
          { status: 201 },
        )
      }),
    )
    renderDetalhe(OCORRENCIA_ABERTA_ID, AGENTE)
    await esperarDetalhe('089/2026')

    await user.type(screen.getByLabelText('Nova nota interna'), '  Morador ausente na primeira visita.  ')
    await user.click(screen.getByRole('button', { name: 'Adicionar nota' }))

    expect(await screen.findByText('Nota interna')).toBeInTheDocument()
    expect(screen.getByText(/Morador ausente na primeira visita\./)).toBeInTheDocument()
    expect(screen.getByLabelText('Nova nota interna')).toHaveValue('')
    expect(corpos).toEqual([{ descricao: 'Morador ausente na primeira visita.' }])
  })

  it('não envia nota vazia', async () => {
    const user = userEvent.setup()
    let chamadas = 0
    server.use(
      http.post(`${API_BASE_URL}/ocorrencias/${OCORRENCIA_ABERTA_ID}/notas`, () => {
        chamadas += 1
        return HttpResponse.json(ocorrenciaAbertaFixture(), { status: 201 })
      }),
    )
    renderDetalhe(OCORRENCIA_ABERTA_ID, AGENTE)
    await esperarDetalhe('089/2026')

    await user.type(screen.getByLabelText('Nova nota interna'), '   ')
    await user.click(screen.getByRole('button', { name: 'Adicionar nota' }))

    expect(await screen.findByText('Escreva a nota antes de adicionar.')).toBeInTheDocument()
    expect(chamadas).toBe(0)
  })

  it('mostra a mensagem do backend quando a nota é recusada (422)', async () => {
    const user = userEvent.setup()
    server.use(
      http.post(`${API_BASE_URL}/ocorrencias/${OCORRENCIA_ABERTA_ID}/notas`, () =>
        HttpResponse.json({ mensagem: 'Ocorrencia encerrada nao pode ser alterada' }, { status: 422 }),
      ),
    )
    renderDetalhe(OCORRENCIA_ABERTA_ID, ADMIN)
    await esperarDetalhe('089/2026')

    await user.type(screen.getByLabelText('Nova nota interna'), 'Nota qualquer.')
    await user.click(screen.getByRole('button', { name: 'Adicionar nota' }))

    expect(await screen.findByText('Ocorrencia encerrada nao pode ser alterada')).toBeInTheDocument()
  })

  it('não mostra o formulário de nota para o Veterinário', async () => {
    renderDetalhe(OCORRENCIA_ABERTA_ID, VET)
    await esperarDetalhe('089/2026')

    expect(screen.queryByLabelText('Nova nota interna')).not.toBeInTheDocument()
  })

  it('não mostra o formulário de nota numa ocorrência encerrada', async () => {
    renderDetalhe(OCORRENCIA_ENCERRADA_ID, ADMIN)
    await esperarDetalhe('070/2026')

    expect(screen.queryByLabelText('Nova nota interna')).not.toBeInTheDocument()
  })
})

// T29: o backend exige o processo completo; até o wizard de processos ser
// integrado (T32/T33), "Abrir processo" fica desabilitado e não envia nada.
// T29: o processo é aberto pelo wizard real, com a etapa 1 pré-preenchida e
// travada nesta ocorrência (DER §3.5). Só para quem escreve em ocorrências
// (D33) e só em ocorrência aberta e sem processo (0..1, D20).
describe('abrir processo (D33, T29)', () => {
  it.each([
    ['Administrador', ADMIN],
    ['Agente Sanitário', AGENTE],
  ])('%s abre o wizard de processo já vinculado a esta ocorrência', async (_perfil, cargos) => {
    const user = userEvent.setup()
    renderDetalhe(OCORRENCIA_ABERTA_ID, cargos)
    await esperarDetalhe('089/2026')

    const abrir = screen.getByRole('link', { name: 'Abrir processo sanitário' })
    expect(abrir).toHaveAttribute('href', `/processos/novo?ocorrencia=${OCORRENCIA_ABERTA_ID}`)

    await user.click(abrir)

    expect(await screen.findByRole('heading', { name: 'Novo Processo Sanitário' })).toBeInTheDocument()
    expect(within(await screen.findByTestId('vinculo-travado')).getByText(/OC 089\/2026/)).toBeInTheDocument()
  })

  it('o Veterinário não vê "Abrir processo" (D33)', async () => {
    renderDetalhe(OCORRENCIA_ABERTA_ID, VET)
    await esperarDetalhe('089/2026')

    expect(screen.queryByRole('link', { name: 'Abrir processo sanitário' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Abrir processo sanitário' })).not.toBeInTheDocument()
    expect(screen.getByText('Nenhum processo sanitário vinculado.')).toBeInTheDocument()
  })

  it('não oferece abrir processo numa ocorrência encerrada (D20)', async () => {
    renderDetalhe(OCORRENCIA_ENCERRADA_ID, ADMIN)
    await esperarDetalhe('070/2026')

    expect(screen.queryByRole('link', { name: 'Abrir processo sanitário' })).not.toBeInTheDocument()
  })

  it('ocorrência que já tem processo mostra o processo, com link para ele, e não oferece abrir outro (0..1)', async () => {
    renderDetalhe(OCORRENCIA_PROCESSO_PENDENTE_ID, ADMIN)
    await esperarDetalhe('092/2026')

    expect(screen.getByRole('link', { name: 'Ver processo' })).toHaveAttribute('href', `/processos/${PROCESSO_PENDENTE_ID}`)
    expect(screen.queryByRole('link', { name: 'Abrir processo sanitário' })).not.toBeInTheDocument()
  })
})

describe('avançar status do processo (provisório, D40)', () => {
  it.each([
    ['Administrador', ADMIN],
    ['Agente Sanitário', AGENTE],
    ['Veterinário', VET],
  ])('%s avança para o próximo status e o cartão mostra o novo status', async (_perfil, cargos) => {
    const user = userEvent.setup()
    const corpos: unknown[] = []
    let avancou = false
    server.use(
      http.patch(`${API_BASE_URL}/processos/${PROCESSO_PENDENTE_ID}/status`, async ({ request }) => {
        corpos.push(await request.json())
        avancou = true
        return HttpResponse.json({ ...PROCESSO_CRIADO_FIXTURE, id: PROCESSO_PENDENTE_ID, statusProcesso: 'COM_RESULTADO' })
      }),
      http.get(`${API_BASE_URL}/ocorrencias/${OCORRENCIA_PROCESSO_PENDENTE_ID}`, () =>
        HttpResponse.json(comStatusProcesso(avancou ? 'COM_RESULTADO' : 'AGUARDANDO_RESULTADO')),
      ),
    )
    renderDetalhe(OCORRENCIA_PROCESSO_PENDENTE_ID, cargos)
    await esperarDetalhe('092/2026')
    expect(screen.getByText('Aguardando resultado')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Avançar status do processo (provisório)' }))

    expect(await screen.findByText('Com resultado')).toBeInTheDocument()
    expect(corpos).toEqual([{ status: 'COM_RESULTADO' }])
  })

  it('não mostra o botão quando o processo já está concluído', async () => {
    server.use(
      http.get(`${API_BASE_URL}/ocorrencias/${OCORRENCIA_PROCESSO_PENDENTE_ID}`, () =>
        HttpResponse.json(comStatusProcesso('CONCLUIDO')),
      ),
    )
    renderDetalhe(OCORRENCIA_PROCESSO_PENDENTE_ID, ADMIN)
    await esperarDetalhe('092/2026')

    expect(screen.getByText('Concluído')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Avançar status do processo (provisório)' })).not.toBeInTheDocument()
  })

  it('processo concluído libera o encerramento (D12)', async () => {
    server.use(
      http.get(`${API_BASE_URL}/ocorrencias/${OCORRENCIA_PROCESSO_PENDENTE_ID}`, () =>
        HttpResponse.json(comStatusProcesso('CONCLUIDO')),
      ),
    )
    renderDetalhe(OCORRENCIA_PROCESSO_PENDENTE_ID, AGENTE)
    await esperarDetalhe('092/2026')

    expect(screen.getByLabelText('Providência tomada')).toBeInTheDocument()
  })

  it('mostra a mensagem do backend quando a transição é recusada (422)', async () => {
    const user = userEvent.setup()
    server.use(
      http.patch(`${API_BASE_URL}/processos/${PROCESSO_PENDENTE_ID}/status`, () =>
        HttpResponse.json({ mensagem: 'Transicao de status do processo invalida' }, { status: 422 }),
      ),
    )
    renderDetalhe(OCORRENCIA_PROCESSO_PENDENTE_ID, VET)
    await esperarDetalhe('092/2026')

    await user.click(screen.getByRole('button', { name: 'Avançar status do processo (provisório)' }))

    await waitFor(() => expect(screen.getByText('Transicao de status do processo invalida')).toBeInTheDocument())
  })
})
