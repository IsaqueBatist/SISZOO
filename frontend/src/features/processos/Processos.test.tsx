import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider, SESSION_STORAGE_KEY } from '../auth/AuthContext'
import type { Usuario } from '../auth/auth.types'
import { Processos } from './Processos'
import { resetProcessosMock } from './processosMockStore'

// listarProcessos embrulhado num vi.fn() que, por padrão, delega pra
// implementação real (mock store) — só a asserção de erro sobrescreve com
// mockRejectedValueOnce, as demais continuam batendo no store de verdade.
vi.mock('./processosApi', async () => {
  const real = await vi.importActual<typeof import('./processosApi')>('./processosApi')
  return { ...real, listarProcessos: vi.fn(real.listarProcessos) }
})
import { listarProcessos } from './processosApi'

function autenticarComCargos(cargos: string[]) {
  const usuario: Usuario = {
    id: 'a1b2c3d4-0000-0000-0000-000000000099',
    nome: 'Usuária',
    sobrenome: 'Teste',
    email: 'usuaria.teste@itu.sp.gov.br',
    cargos,
    senhaAlteradaEm: '2026-01-10T12:00:00Z',
  }
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ token: 'token-existente', usuario }))
}

function renderLista(cargos: string[]) {
  autenticarComCargos(cargos)
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/processos']}>
        <AuthProvider>
          <Routes>
            <Route path="/processos" element={<Processos />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

// Ids/protocolos semeados em ./processosMockStore.ts (seedProcessosMock).
const PROCESSO_RAIVA_URGENTE_ID = 'p1000000-0000-0000-0000-000000000001'
const OCORRENCIA_SIGILOSA_ID = 'h5000000-0000-0000-0000-000000000006'

describe('Processos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetProcessosMock()
  })

  it('renderiza a listagem com as colunas, doença como label e status como badge', async () => {
    renderLista(['Administrador'])

    expect(await screen.findByText('001/2026')).toBeInTheDocument()
    // Doença aparece como rótulo legível, nunca o valor cru do enum.
    expect(screen.getAllByText('Raiva').length).toBeGreaterThan(0)
    expect(screen.queryByText('raiva')).not.toBeInTheDocument()
    expect(screen.getAllByText('Aberto').length).toBeGreaterThan(0)
  })

  it('mantém os urgentes no topo em todas as páginas, sem nenhum urgente depois de um não urgente', async () => {
    renderLista(['Administrador'])
    await screen.findByText('001/2026')

    function checarOrdemDaPagina() {
      const linhas = document.querySelectorAll('table.data tbody tr')
      const flags = Array.from(linhas).map((linha) => linha.classList.contains('urgent'))
      const primeiroNaoUrgente = flags.indexOf(false)
      if (primeiroNaoUrgente !== -1) {
        expect(flags.slice(primeiroNaoUrgente)).not.toContain(true)
      }
    }

    checarOrdemDaPagina()
    expect(screen.getByText(/Página 1 de 2/)).toBeInTheDocument()

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Próximo' }))
    await screen.findByText(/Página 2 de 2/)
    checarOrdemDaPagina()
  })

  it('ordena por data de abertura desc dentro do grupo não urgente (critério secundário)', async () => {
    const user = userEvent.setup()
    renderLista(['Administrador'])
    await screen.findByText('001/2026')

    await user.selectOptions(screen.getByLabelText('Filtrar por doença'), 'Febre Amarela')
    // '001/2026' só existe fora do filtro — esperar seu sumiço garante que o
    // resultado filtrado (não o placeholder da página anterior) já renderizou.
    await waitFor(() => expect(screen.queryByText('001/2026')).not.toBeInTheDocument())

    const tbody = document.querySelector('table.data tbody') as HTMLElement
    const protocolos = within(tbody)
      .getAllByText(/^0\d{2}\/2026$/)
      .map((el) => el.textContent)
    // 006 (25/09) > 014 (06/06) > 020 (12/03), todos não urgentes.
    expect(protocolos).toEqual(['006/2026', '014/2026', '020/2026'])
  })

  it('filtra por doença', async () => {
    const user = userEvent.setup()
    renderLista(['Administrador'])
    await screen.findByText('001/2026')

    await user.selectOptions(screen.getByLabelText('Filtrar por doença'), 'Raiva')

    await waitFor(() => expect(screen.queryByText('002/2026')).not.toBeInTheDocument())
    expect(screen.getByText('001/2026')).toBeInTheDocument()
    expect(screen.getByText('007/2026')).toBeInTheDocument()
  })

  it('filtra por status', async () => {
    const user = userEvent.setup()
    renderLista(['Administrador'])
    await screen.findByText('001/2026')

    await user.selectOptions(screen.getByLabelText('Filtrar por status'), 'Concluído')

    await waitFor(() => expect(screen.queryByText('001/2026')).not.toBeInTheDocument())
    expect(screen.getByText('003/2026')).toBeInTheDocument()
    expect(screen.getByText('004/2026')).toBeInTheDocument()
  })

  it('combina filtro de doença e status, mantendo urgentes no topo do resultado filtrado', async () => {
    const user = userEvent.setup()
    renderLista(['Administrador'])
    await screen.findByText('001/2026')

    await user.selectOptions(screen.getByLabelText('Filtrar por doença'), 'Leptospirose')
    await user.selectOptions(screen.getByLabelText('Filtrar por status'), 'Concluído')

    // 008/2026 é leptospirose urgente (visível antes do filtro combinado
    // aplicar) mas está com status aguardando_resultado — some assim que o
    // filtro combinado (doença + concluído) realmente aplicar.
    await waitFor(() => expect(screen.queryByText('008/2026')).not.toBeInTheDocument())

    // 003/2026 (especial) + 012/2026 e 024/2026 (lote genérico) são os únicos
    // leptospirose+concluído do seed.
    expect(screen.getByText('003/2026')).toBeInTheDocument()
    const linhas = document.querySelectorAll('table.data tbody tr')
    expect(linhas).toHaveLength(3)
  })

  it('mudar o filtro volta a listagem para a página 0', async () => {
    const user = userEvent.setup()
    renderLista(['Administrador'])
    await screen.findByText('001/2026')

    await user.click(screen.getByRole('button', { name: 'Próximo' }))
    await screen.findByText(/Página 2 de 2/)

    await user.selectOptions(screen.getByLabelText('Filtrar por doença'), 'Raiva')

    await waitFor(() => expect(screen.getByText(/Página 1 de/)).toBeInTheDocument())
  })

  it('linha urgente tem destaque de cor e também texto "Urgente" (não depende só de cor)', async () => {
    renderLista(['Administrador'])
    await screen.findByText('001/2026')

    const linha = screen.getByText('001/2026').closest('tr')
    expect(linha).toHaveClass('urgent')
    expect(within(linha as HTMLElement).getByText('Urgente')).toBeInTheDocument()
  })

  it('o link "Ver" aponta para o id correto do processo', async () => {
    renderLista(['Administrador'])
    await screen.findByText('001/2026')

    const link = screen.getByRole('link', { name: /ver processo 001\/2026/i })
    expect(link).toHaveAttribute('href', `/processos/${PROCESSO_RAIVA_URGENTE_ID}`)
  })

  it('o link da ocorrência vinculada aponta para /ocorrencias/:id', async () => {
    const user = userEvent.setup()
    renderLista(['Administrador'])
    await screen.findByText('001/2026')

    await user.selectOptions(screen.getByLabelText('Filtrar por doença'), 'Febre Maculosa')
    await screen.findByText('005/2026')

    const link = screen.getByRole('link', { name: '095/2026' })
    expect(link).toHaveAttribute('href', `/ocorrencias/${OCORRENCIA_SIGILOSA_ID}`)
  })

  it('mostra o estado vazio com mensagem de filtro quando a combinação não encontra nada', async () => {
    const user = userEvent.setup()
    renderLista(['Administrador'])
    await screen.findByText('001/2026')

    await user.selectOptions(screen.getByLabelText('Filtrar por doença'), 'Raiva')
    await user.selectOptions(screen.getByLabelText('Filtrar por status'), 'Concluído')

    expect(await screen.findByText('Nenhum processo sanitário encontrado')).toBeInTheDocument()
    expect(screen.getByText('Ajuste os filtros de busca.')).toBeInTheDocument()
  })

  it('mostra estado de erro quando a listagem falha', async () => {
    vi.mocked(listarProcessos).mockRejectedValueOnce(new Error('falhou'))

    renderLista(['Administrador'])

    expect(
      await screen.findByText('Não foi possível carregar os processos sanitários. Tente novamente.'),
    ).toBeInTheDocument()
  })

  it.each(['Administrador', 'Veterinário', 'Agente Sanitário'])(
    'mostra o botão "Novo Processo" para o perfil %s',
    async (cargo) => {
      renderLista([cargo])
      expect(await screen.findByRole('link', { name: /Novo Processo/i })).toBeInTheDocument()
    },
  )
})
