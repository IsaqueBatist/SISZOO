import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ToastProvider } from '@/components/toast/ToastProvider'
import { AuthProvider, SESSION_STORAGE_KEY } from '@/features/auth/hooks/AuthContext'
import type { Usuario } from '@/features/auth/types/auth.types'
import { Vacinas } from './Vacinas'
function renderVacinas(cargos: string[] = ['Administrador']) {
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
      <MemoryRouter initialEntries={['/vacinas']}>
        <ToastProvider>
          <AuthProvider>
            <Routes>
              <Route path="/vacinas" element={<Vacinas />} />
            </Routes>
          </AuthProvider>
        </ToastProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}
afterEach(() => {
  vi.restoreAllMocks()
})
describe('Vacinas', () => {
  it('lista o catálogo com o intervalo de reforço', async () => {
    renderVacinas()
    const linha = (await screen.findByText('Antirrábica')).closest('tr') as HTMLElement
    expect(within(linha).getByText('12 meses')).toBeInTheDocument()
    expect(within(linha).getByText('Ativa')).toBeInTheDocument()
  })
  it('cadastra uma vacina nova com intervalo', async () => {
    const user = userEvent.setup()
    renderVacinas()
    await screen.findByText('Antirrábica')
    await user.type(screen.getByLabelText(/^nome/i), 'Tríplice Felina')
    await user.type(screen.getByLabelText(/intervalo de reforço/i), '24')
    await user.click(screen.getByRole('button', { name: /cadastrar vacina/i }))
    expect(await screen.findByLabelText('Avisos')).toHaveTextContent('Tríplice Felina cadastrada.')
    const linha = (await screen.findByText('Tríplice Felina')).closest('tr') as HTMLElement
    expect(within(linha).getByText('24 meses')).toBeInTheDocument()
  })
  it('aceita vacina sem intervalo e deixa claro que ela não gera alerta', async () => {
    const user = userEvent.setup()
    renderVacinas()
    await screen.findByText('Antirrábica')
    await user.type(screen.getByLabelText(/^nome/i), 'Vacina Sem Reforco')
    await user.click(screen.getByRole('button', { name: /cadastrar vacina/i }))
    const linha = (await screen.findByText('Vacina Sem Reforco')).closest('tr') as HTMLElement
    expect(within(linha).getByText('Sem reforço')).toBeInTheDocument()
  })
  // Dois nomes diferentes derivam o mesmo código; o usuário não vê o código,
  // então a mensagem precisa nomear o conflito.
  it('mostra o motivo quando o nome colide com uma vacina existente', async () => {
    const user = userEvent.setup()
    renderVacinas()
    await screen.findByText('Antirrábica')
    await user.type(screen.getByLabelText(/^nome/i), 'antirrabica')
    await user.click(screen.getByRole('button', { name: /cadastrar vacina/i }))
    expect(await screen.findByText(/Ja existe a vacina "Antirrábica"/)).toBeInTheDocument()
  })
  it('desativa e reativa uma vacina', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const user = userEvent.setup()
    renderVacinas()
    const linha = (await screen.findByText('Giárdia')).closest('tr') as HTMLElement
    await user.click(within(linha).getByRole('button', { name: /desativar/i }))
    // Some da lista: por padrão só as ativas aparecem.
    await waitFor(() => expect(screen.queryByText('Giárdia')).not.toBeInTheDocument())
    await user.click(screen.getByLabelText(/mostrar inativas/i))
    const linhaInativa = (await screen.findByText('Giárdia')).closest('tr') as HTMLElement
    expect(within(linhaInativa).getByText('Inativa')).toBeInTheDocument()
    await user.click(within(linhaInativa).getByRole('button', { name: /reativar/i }))
    expect(await screen.findByLabelText('Avisos')).toHaveTextContent('Giárdia reativada.')
  })
  it('o Agente vê o catálogo mas não o formulário de cadastro', async () => {
    renderVacinas(['Agente Sanitário'])
    await screen.findByText('Antirrábica')
    expect(screen.queryByRole('button', { name: /cadastrar vacina/i })).not.toBeInTheDocument()
  })
})
