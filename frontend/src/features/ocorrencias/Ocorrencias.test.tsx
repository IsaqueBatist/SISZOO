import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AuthProvider, SESSION_STORAGE_KEY } from '../auth/AuthContext'
import type { Usuario } from '../auth/auth.types'
import { Ocorrencias } from './Ocorrencias'

function renderLista(cargos: string[]) {
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
      <MemoryRouter initialEntries={['/ocorrencias']}>
        <AuthProvider>
          <Routes>
            <Route path="/ocorrencias" element={<Ocorrencias />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('Ocorrencias', () => {
  it('renderiza a listagem com as ocorrências semeadas', async () => {
    renderLista(['Administrador'])

    expect(await screen.findByText('089/2026')).toBeInTheDocument()
    expect(screen.getByText('090/2026')).toBeInTheDocument()
    expect(screen.getByText('092/2026')).toBeInTheDocument()
    expect(screen.getByText('070/2026')).toBeInTheDocument()
  })

  it('filtra por tipo', async () => {
    const user = userEvent.setup()
    renderLista(['Administrador'])
    await screen.findByText('089/2026')

    await user.selectOptions(screen.getByLabelText('Filtrar por tipo'), 'Suspeita de Zoonose')

    await waitFor(() => expect(screen.queryByText('070/2026')).not.toBeInTheDocument())
    expect(screen.getByText('089/2026')).toBeInTheDocument()
    expect(screen.getByText('092/2026')).toBeInTheDocument()
    expect(screen.queryByText('090/2026')).not.toBeInTheDocument()
  })

  it('filtra por status', async () => {
    const user = userEvent.setup()
    renderLista(['Administrador'])
    await screen.findByText('089/2026')

    await user.selectOptions(screen.getByLabelText('Filtrar por status'), 'Encerrada')

    await waitFor(() => expect(screen.queryByText('089/2026')).not.toBeInTheDocument())
    expect(screen.getByText('070/2026')).toBeInTheDocument()
  })

  it('mostra "Sigiloso" na coluna denunciante para perfil não-admin, sem quebrar o layout', async () => {
    renderLista(['Agente Sanitário'])

    const linha = (await screen.findByText('090/2026')).closest('tr') as HTMLElement
    // getAllByText porque o seed da T33 (095/2026) também é sigiloso —
    // "Sigiloso" não é mais único na página, então a asserção escopa pra
    // linha da ocorrência 090/2026 especificamente.
    expect(within(linha).getByText('Sigiloso')).toBeInTheDocument()
    expect(screen.queryByText('João Pereira Lima')).not.toBeInTheDocument()
  })

  it('a busca livre pelo nome real do denunciante sigiloso, como perfil não-admin, não traz a ocorrência', async () => {
    const user = userEvent.setup()
    renderLista(['Agente Sanitário'])
    await screen.findByText('089/2026')

    await user.type(screen.getByPlaceholderText(/Buscar protocolo/i), 'João')

    await waitFor(() => expect(screen.queryByText('089/2026')).not.toBeInTheDocument())
    expect(screen.queryByText('090/2026')).not.toBeInTheDocument()
  })

  it('o link "Ver" aponta para o detalhe da ocorrência certa', async () => {
    renderLista(['Administrador'])
    await screen.findByText('089/2026')

    const link = screen.getByRole('link', { name: /ver ocorrência 089\/2026/i })
    expect(link).toHaveAttribute('href', '/ocorrencias/h5000000-0000-0000-0000-000000000001')
  })

  it('a coluna "Processo Vinc." é um link pro detalhe do processo (T33)', async () => {
    renderLista(['Administrador'])
    await screen.findByText('092/2026')

    const link = screen.getByRole('link', { name: '045/2026' })
    expect(link).toHaveAttribute('href', '/processos/h7000000-0000-0000-0000-000000000001')
  })

  it('não mostra o botão "Registrar Ocorrência" para o perfil Veterinário', async () => {
    renderLista(['Veterinário'])
    await screen.findByText('089/2026')

    expect(screen.queryByRole('link', { name: /registrar ocorrência/i })).not.toBeInTheDocument()
  })

  it('mostra o botão "Registrar Ocorrência" para Administrador e Agente Sanitário', async () => {
    renderLista(['Agente Sanitário'])
    await screen.findByText('089/2026')

    expect(screen.getByRole('link', { name: /registrar ocorrência/i })).toBeInTheDocument()
  })
})
