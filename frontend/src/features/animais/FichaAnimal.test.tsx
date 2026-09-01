import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AuthProvider, SESSION_STORAGE_KEY } from '../auth/AuthContext'
import type { Usuario } from '../auth/auth.types'
import { FichaAnimal } from './FichaAnimal'

const REX_ID = 'b2c3d4e5-0000-0000-0000-000000000001'

function renderFicha(cargos: string[] = ['Veterinário']) {
  const usuario: Usuario = {
    id: 'a1b2c3d4-0000-0000-0000-000000000001',
    nome: 'Stéphanie',
    sobrenome: 'Lima',
    email: 'stephanie.lima@itu.sp.gov.br',
    cargos,
    senhaAlteradaEm: '2026-01-10T12:00:00Z',
  }
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ token: 'token-existente', usuario }))

  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/animais/${REX_ID}`]}>
        <AuthProvider>
          <Routes>
            <Route path="/animais/:id" element={<FichaAnimal />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('FichaAnimal', () => {
  it('mostra o cabeçalho de identidade com os dados reais do animal', async () => {
    renderFicha()

    expect(await screen.findByRole('heading', { name: 'Rex', level: 1 })).toBeInTheDocument()
    expect(screen.getByText('985121234567890')).toBeInTheDocument()
    expect(screen.getByText('Baia 3')).toBeInTheDocument()
    // "Canino" aparece 2x: o badge de espécie no cabeçalho e o valor na
    // kv-list do painel de identidade.
    expect(screen.getAllByText('Canino')).toHaveLength(2)
    expect(screen.getByText('Disponível').closest('.badge')).toHaveClass('badge-available')
  })

  it('troca de aba ao clicar e mostra o conteúdo correspondente', async () => {
    const user = userEvent.setup()
    renderFicha()
    await screen.findByRole('heading', { name: 'Rex', level: 1 })

    await user.click(screen.getByRole('tab', { name: /vacinas/i }))
    expect(await screen.findByText('V10')).toBeInTheDocument()
    expect(screen.getByText('Antirrábica')).toBeInTheDocument()
    expect(screen.getByText('Giárdia')).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: /procedimentos\/cirurgias/i }))
    expect(await screen.findByText('Castração')).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: /^medicamentos/i }))
    expect(await screen.findByText('Fenobarbital 30mg')).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: /exames/i }))
    expect(await screen.findByText(/estarão disponíveis em uma versão futura/i)).toBeInTheDocument()
  })

  it('destaca vacina vencida, a vencer e em dia com o badge correto', async () => {
    const user = userEvent.setup()
    renderFicha()
    await screen.findByRole('heading', { name: 'Rex', level: 1 })
    await user.click(screen.getByRole('tab', { name: /vacinas/i }))
    await screen.findByText('V10')

    const linhaVencida = screen.getByText('V10').closest('tr')
    const linhaAVencer = screen.getByText('Antirrábica').closest('tr')
    const linhaEmDia = screen.getByText('Giárdia').closest('tr')
    if (!linhaVencida || !linhaAVencer || !linhaEmDia) throw new Error('linha não encontrada')

    expect(within(linhaVencida).getByText(/vencida/i)).toBeInTheDocument()
    expect(linhaVencida).toHaveClass('reforco-warning')

    expect(within(linhaAVencer).getByText(/em \d+ dias?/i)).toBeInTheDocument()
    expect(linhaAVencer).toHaveClass('reforco-soon')

    expect(within(linhaEmDia).getByText('Em dia')).toBeInTheDocument()
  })

  it('marca o registro original como "Retificado" quando existe uma correção', async () => {
    const user = userEvent.setup()
    renderFicha()
    await screen.findByRole('heading', { name: 'Rex', level: 1 })
    await user.click(screen.getByRole('tab', { name: /vacinas/i }))

    const linhasLeishmaniose = (await screen.findAllByText('Leishmaniose'))
      .map((celula) => celula.closest('tr'))
      .filter((linha): linha is HTMLTableRowElement => linha !== null)
    expect(linhasLeishmaniose).toHaveLength(2)

    const comBadgeRetificado = linhasLeishmaniose.filter((linha) => within(linha).queryByText('Retificado'))
    expect(comBadgeRetificado).toHaveLength(1)
  })

  it('mostra o histórico geral mesclando vacinas, procedimentos e medicamentos por data', async () => {
    renderFicha()
    await screen.findByRole('heading', { name: 'Rex', level: 1 })

    expect(await screen.findByText('Vacina V10 aplicada')).toBeInTheDocument()
    expect(screen.getByText('Castração')).toBeInTheDocument()
    expect(screen.getByText('Início: Fenobarbital 30mg')).toBeInTheDocument()
    expect(await screen.findByText('Fim do histórico')).toBeInTheDocument()
    expect(screen.getByText('Entrada no CCZ')).toBeInTheDocument()
  })

  it('mostra os botões de registro para Veterinário e Administrador', async () => {
    const user = userEvent.setup()
    renderFicha(['Administrador'])
    await screen.findByRole('heading', { name: 'Rex', level: 1 })

    await user.click(screen.getByRole('tab', { name: /vacinas/i }))
    expect(await screen.findByRole('button', { name: /registrar vacina/i })).toBeInTheDocument()
  })

  it('registra uma nova vacinação e a lista reflete o novo registro imediatamente', async () => {
    const user = userEvent.setup()
    const { container } = renderFicha(['Administrador'])
    await screen.findByRole('heading', { name: 'Rex', level: 1 })
    await user.click(screen.getByRole('tab', { name: /vacinas/i }))
    await screen.findByText('V10')
    expect(container.querySelector('.table-footer')).toHaveTextContent('Mostrando 5 de 5 vacinas')

    await user.click(screen.getByRole('button', { name: /registrar vacina/i }))
    const modal = screen.getByRole('heading', { name: 'Registrar vacina' }).closest<HTMLElement>('.modal')
    if (!modal) throw new Error('modal não encontrado')

    await user.selectOptions(within(modal).getByLabelText(/^vacina/i), 'v8')
    fireEvent.change(within(modal).getByLabelText(/data de aplicação/i), { target: { value: '2026-05-01' } })
    await user.type(within(modal).getByLabelText(/quantidade da dose/i), '1')
    await user.click(within(modal).getByRole('button', { name: /^registrar vacina$/i }))

    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Registrar vacina' })).not.toBeInTheDocument())
    expect(await screen.findByText('V8')).toBeInTheDocument()
    expect(container.querySelector('.table-footer')).toHaveTextContent('Mostrando 6 de 6 vacinas')
  })

  it('esconde os botões de registro para Agente Sanitário (perfil só-leitura)', async () => {
    const user = userEvent.setup()
    renderFicha(['Agente Sanitário'])
    await screen.findByRole('heading', { name: 'Rex', level: 1 })

    await user.click(screen.getByRole('tab', { name: /vacinas/i }))
    await screen.findByText('V10')
    expect(screen.queryByRole('button', { name: /registrar vacina/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /editar ficha/i })).not.toBeInTheDocument()
  })
})
