import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { AuthProvider, SESSION_STORAGE_KEY } from '../auth/AuthContext'
import type { Usuario } from '../auth/auth.types'
import { PROCESSO_SIGILOSO_ID, registrarResultadoMock, resetProcessosMock } from '../processos/processosMockStore'
import { OcorrenciaDetalhe } from './OcorrenciaDetalhe'

// Ids semeados em ./ocorrenciasMockStore.ts (seedOcorrenciasMock).
const OCORRENCIA_ABERTA_ID = 'h5000000-0000-0000-0000-000000000001'
const OCORRENCIA_SIGILOSA_ID = 'h5000000-0000-0000-0000-000000000002'
const OCORRENCIA_EM_ATENDIMENTO_ID = 'h5000000-0000-0000-0000-000000000004'
const OCORRENCIA_ENCERRADA_ID = 'h5000000-0000-0000-0000-000000000005'
// 095/2026, vinculada a PROCESSO_SIGILOSO_ID (../processos/processosMockStore.ts) —
// par usado só para exercitar o fechamento da regra 13 (resultadoPendente) abaixo.
const OCORRENCIA_SIGILOSA_COM_PROCESSO_ID = 'h5000000-0000-0000-0000-000000000006'
// 006/2026, aberto, sem ocorrência vinculada (../processos/processosMockStore.ts).
const PROCESSO_SEM_VINCULO_ID = 'p1000000-0000-0000-0000-000000000006'

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

  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/ocorrencias/${ocorrenciaId}`]}>
        <AuthProvider>
          <Routes>
            <Route path="/ocorrencias/:id" element={<OcorrenciaDetalhe />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('OcorrenciaDetalhe', () => {
  // ocorrenciasMock já é resetado globalmente no afterEach de
  // ../../test/setup.ts — processosMock não faz parte dessa lista e
  // precisa de reset explícito aqui (mesmo padrão de
  // ../processos/ProcessoDetalhe.test.tsx).
  beforeEach(() => {
    resetProcessosMock()
  })

  it('renderiza os dados gerais, denunciante, movimentações e anexos', async () => {
    renderDetalhe(OCORRENCIA_ENCERRADA_ID, ['Administrador'])

    expect(await screen.findByRole('heading', { name: 'Ocorrência 070/2026', level: 1 })).toBeInTheDocument()
    expect(screen.getByText('Escola Municipal Parque das Flores')).toBeInTheDocument()
    expect(screen.getByText('Foto do animal.jpg')).toBeInTheDocument()
  })

  it('mostra o placeholder "Sigiloso" para uma ocorrência sigilosa vista por perfil não-admin, sem quebrar o layout', async () => {
    renderDetalhe(OCORRENCIA_SIGILOSA_ID, ['Agente Sanitário'])

    await screen.findByRole('heading', { name: 'Ocorrência 090/2026', level: 1 })
    expect(screen.getAllByText('Sigiloso').length).toBeGreaterThan(0)
  })

  it('mostra os dados reais do denunciante para a mesma ocorrência sigilosa vista por Admin', async () => {
    renderDetalhe(OCORRENCIA_SIGILOSA_ID, ['Administrador'])

    await screen.findByRole('heading', { name: 'Ocorrência 090/2026', level: 1 })
    expect(screen.getByText('João Pereira Lima')).toBeInTheDocument()
    expect(screen.queryByText('Sigiloso')).not.toBeInTheDocument()
  })

  it('não mostra o formulário de encerramento para o perfil Veterinário (só leitura)', async () => {
    renderDetalhe(OCORRENCIA_ABERTA_ID, ['Veterinário'])

    await screen.findByRole('heading', { name: 'Ocorrência 089/2026', level: 1 })
    expect(screen.queryByLabelText('Providência tomada')).not.toBeInTheDocument()
    expect(screen.getByText('Seu perfil não pode encerrar ocorrências')).toBeInTheDocument()
  })

  it('mostra os dados de encerramento e nenhum formulário para uma ocorrência já encerrada', async () => {
    renderDetalhe(OCORRENCIA_ENCERRADA_ID, ['Administrador'])

    await screen.findByRole('heading', { name: 'Ocorrência 070/2026', level: 1 })
    expect(screen.queryByLabelText('Providência tomada')).not.toBeInTheDocument()
    expect(screen.getByText('Captura e remoção do animal')).toBeInTheDocument()
  })

  it('mostra a linha do tempo em ordem cronológica decrescente, com tipo, data e autor', async () => {
    renderDetalhe(OCORRENCIA_ENCERRADA_ID, ['Administrador'])

    await screen.findByRole('heading', { name: 'Ocorrência 070/2026', level: 1 })

    const titulos = screen
      .getAllByText(/Ocorrência encerrada|Equipe despachada|Ocorrência registrada/)
      .map((el) => el.textContent)
    expect(titulos).toEqual(['Ocorrência encerrada', 'Equipe despachada', 'Ocorrência registrada'])
    expect(screen.getByText('12/05/2026 · 13:00')).toBeInTheDocument()
  })

  it('encerra a ocorrência: o form some, os dados somente-leitura aparecem e a movimentação de encerramento entra na timeline', async () => {
    const user = userEvent.setup()
    renderDetalhe(OCORRENCIA_ABERTA_ID, ['Administrador'])

    await screen.findByRole('heading', { name: 'Ocorrência 089/2026', level: 1 })
    await user.selectOptions(screen.getByLabelText('Providência tomada'), 'Sem ação necessária')
    await user.click(screen.getByRole('button', { name: 'Encerrar ocorrência' }))

    expect(await screen.findByText('Ocorrência encerrada')).toBeInTheDocument()
    expect(screen.queryByLabelText('Providência tomada')).not.toBeInTheDocument()
    expect(screen.getByText('Sem ação necessária')).toBeInTheDocument()
  })

  it('mostra "Iniciar Atendimento" para Admin/Agente quando a ocorrência está aberta', async () => {
    renderDetalhe(OCORRENCIA_ABERTA_ID, ['Agente Sanitário'])

    expect(await screen.findByRole('button', { name: 'Iniciar Atendimento' })).toBeInTheDocument()
  })

  it('não mostra "Iniciar Atendimento" para o perfil Veterinário', async () => {
    renderDetalhe(OCORRENCIA_ABERTA_ID, ['Veterinário'])

    await screen.findByRole('heading', { name: 'Ocorrência 089/2026', level: 1 })
    expect(screen.queryByRole('button', { name: 'Iniciar Atendimento' })).not.toBeInTheDocument()
  })

  it('não mostra "Iniciar Atendimento" quando a ocorrência já não está aberta', async () => {
    renderDetalhe(OCORRENCIA_EM_ATENDIMENTO_ID, ['Administrador'])

    await screen.findByRole('heading', { name: 'Ocorrência 092/2026', level: 1 })
    expect(screen.queryByRole('button', { name: 'Iniciar Atendimento' })).not.toBeInTheDocument()
  })

  it('o card de processo vinculado é um link pro detalhe do processo (T33)', async () => {
    renderDetalhe(OCORRENCIA_EM_ATENDIMENTO_ID, ['Administrador'])

    await screen.findByRole('heading', { name: 'Ocorrência 092/2026', level: 1 })
    const link = screen.getByRole('link', { name: /Processo Sanitário Vinculado/ })
    expect(link).toHaveAttribute('href', '/processos/h7000000-0000-0000-0000-000000000001')
  })

  it('inicia o atendimento: o badge muda para "Em atendimento" e entra uma movimentação na timeline', async () => {
    const user = userEvent.setup()
    renderDetalhe(OCORRENCIA_ABERTA_ID, ['Administrador'])

    await user.click(await screen.findByRole('button', { name: 'Iniciar Atendimento' }))

    expect(await screen.findByText('Em atendimento')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Iniciar Atendimento' })).not.toBeInTheDocument()
    expect(screen.getByText('Ocorrência movida para "Em atendimento".')).toBeInTheDocument()
  })

  // Fecha o loop da regra 13: antes desta entrega nada zerava
  // `resultadoPendente` do lado da ocorrência, então "Encerrar" ficava
  // bloqueado para sempre numa ocorrência vinculada a um processo. Aqui o
  // resultado é registrado direto no mock store (ação que mora na tela do
  // processo, não na da ocorrência) para então verificar o reflexo na tela
  // de ocorrência.
  it('processo vinculado com resultado registrado libera "Encerrar ocorrência" (regra 13)', async () => {
    registrarResultadoMock(PROCESSO_SIGILOSO_ID, { resultadoLaboratorial: 'negativo' })
    renderDetalhe(OCORRENCIA_SIGILOSA_COM_PROCESSO_ID, ['Administrador'])

    await screen.findByRole('heading', { name: 'Ocorrência 095/2026', level: 1 })
    expect(screen.getByRole('button', { name: 'Encerrar ocorrência' })).toBeEnabled()
    expect(screen.queryByText('Disponível após resultado do processo')).not.toBeInTheDocument()
  })

  it('vincula um processo já cadastrado a uma ocorrência sem vínculo', async () => {
    const user = userEvent.setup()
    renderDetalhe(OCORRENCIA_ABERTA_ID, ['Administrador'])

    await screen.findByRole('heading', { name: 'Ocorrência 089/2026', level: 1 })
    expect(screen.getByRole('link', { name: 'Abrir Processo Sanitário' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'ou vincular um processo já cadastrado' }))
    await user.click(await screen.findByText('006/2026'))
    await user.click(screen.getByRole('button', { name: 'Vincular processo selecionado' }))

    expect(await screen.findByRole('link', { name: /Processo Sanitário Vinculado/ })).toHaveAttribute(
      'href',
      `/processos/${PROCESSO_SEM_VINCULO_ID}`,
    )
  })
})
