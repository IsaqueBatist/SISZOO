import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AuthProvider, SESSION_STORAGE_KEY } from '@/features/auth/hooks/AuthContext'
import type { Usuario } from '@/features/auth/types/auth.types'
import { FichaAnimal } from './FichaAnimal'

// F2-007 / RF-A04 (Fase 3 do TG): a aba "Exames" deixou de ser placeholder.
const REX_ID = 'b2c3d4e5-0000-0000-0000-000000000001'

function renderFicha(cargos: string[] = ['Veterinário']) {
  const usuario: Usuario = {
    id: 'a1b2c3d4-0000-0000-0000-000000000001',
    nome: 'Mariana',
    sobrenome: 'Souza',
    email: 'mariana.souza@itu.sp.gov.br',
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

describe('AbaExames', () => {
  it('veterinário: aba vazia, registra um exame pendente e ele aparece como "Aguardando resultado"', async () => {
    const user = userEvent.setup()
    renderFicha()
    await screen.findByRole('tab', { name: 'Exames' })
    await user.click(screen.getByRole('tab', { name: 'Exames' }))

    expect(await screen.findByText('Nenhum exame registrado')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Registrar exame' }))

    expect(await screen.findByRole('heading', { name: 'Registrar exame' })).toBeInTheDocument()
    await screen.findByRole('option', { name: 'Hemograma' })
    await user.selectOptions(screen.getByLabelText(/Tipo de exame/), 'hemograma')
    await user.selectOptions(screen.getByLabelText('Laboratório'), 'ial_sorocaba')
    const botoes = screen.getAllByRole('button', { name: 'Registrar exame' })
    await user.click(botoes[botoes.length - 1])

    expect(await screen.findByText('Hemograma')).toBeInTheDocument()
    expect(screen.getByText('Aguardando resultado')).toBeInTheDocument()
    expect(screen.getByText('Instituto Adolfo Lutz - Sorocaba')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Lançar resultado' })).toBeInTheDocument()
  })

  it('agente sanitário (só leitura) não vê o botão de registrar exame', async () => {
    const user = userEvent.setup()
    renderFicha(['Agente Sanitário'])
    await screen.findByRole('tab', { name: 'Exames' })
    await user.click(screen.getByRole('tab', { name: 'Exames' }))

    expect(await screen.findByText('Nenhum exame registrado')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Registrar exame' })).not.toBeInTheDocument()
  })

  it('cartão de anexos aparece na ficha com estado vazio e botão Anexar para quem escreve', async () => {
    renderFicha()
    expect(await screen.findByText('Nenhum anexo registrado.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Anexar' })).toBeInTheDocument()
  })
})
