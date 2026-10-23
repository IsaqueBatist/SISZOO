import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AuthProvider, SESSION_STORAGE_KEY } from '@/features/auth/hooks/AuthContext'
import type { Usuario } from '@/features/auth/types/auth.types'
import { MenuPerfil } from './MenuPerfil'

function renderMenuPerfil() {
  const usuario: Usuario = {
    id: 'a1b2c3d4-0000-0000-0000-000000000001',
    nome: 'Stéphanie',
    sobrenome: 'Lima',
    email: 'stephanie.lima@itu.sp.gov.br',
    cargos: ['Administrador'],
    senhaAlteradaEm: '2026-01-10T12:00:00Z',
  }
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ token: 'token-existente', usuario }))

  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/dashboard']}>
        <AuthProvider>
          <Routes>
            <Route path="/dashboard" element={<MenuPerfil />} />
            <Route path="/perfil" element={<p>Tela de perfil</p>} />
            <Route path="/configuracoes" element={<p>Tela de configurações</p>} />
            <Route path="/login" element={<p>Tela de login</p>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('MenuPerfil', () => {
  it('abre ao clicar e mostra nome, e-mail e papel', async () => {
    const user = userEvent.setup()
    renderMenuPerfil()

    await user.click(screen.getByRole('button', { name: /stéphanie/i }))

    expect(screen.getByRole('menu')).toBeInTheDocument()
    expect(screen.getByText('Stéphanie Lima')).toBeInTheDocument()
    expect(screen.getByText('stephanie.lima@itu.sp.gov.br')).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /meu perfil/i })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /configurações/i })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /sair/i })).toBeInTheDocument()
  })

  it('fecha ao pressionar Esc e devolve o foco ao botão', async () => {
    const user = userEvent.setup()
    renderMenuPerfil()

    const botao = screen.getByRole('button', { name: /stéphanie/i })
    await user.click(botao)
    expect(screen.getByRole('menu')).toBeInTheDocument()

    await user.keyboard('{Escape}')

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(botao).toHaveFocus()
  })

  it('fecha ao clicar fora', async () => {
    const user = userEvent.setup()
    renderMenuPerfil()

    await user.click(screen.getByRole('button', { name: /stéphanie/i }))
    expect(screen.getByRole('menu')).toBeInTheDocument()

    await user.click(document.body)

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('seta para baixo no botão abre o menu com foco no primeiro item', async () => {
    const user = userEvent.setup()
    renderMenuPerfil()

    screen.getByRole('button', { name: /stéphanie/i }).focus()
    await user.keyboard('{ArrowDown}')

    expect(screen.getByRole('menuitem', { name: /meu perfil/i })).toHaveFocus()
  })

  it('"Meu perfil" e "Configurações" navegam para as rotas certas', async () => {
    const user = userEvent.setup()
    renderMenuPerfil()

    await user.click(screen.getByRole('button', { name: /stéphanie/i }))
    await user.click(screen.getByRole('menuitem', { name: /meu perfil/i }))

    expect(await screen.findByText('Tela de perfil')).toBeInTheDocument()
  })

  it('"Sair" encerra a sessão e navega para o login', async () => {
    const user = userEvent.setup()
    renderMenuPerfil()

    await user.click(screen.getByRole('button', { name: /stéphanie/i }))
    await user.click(screen.getByRole('menuitem', { name: /sair/i }))

    expect(await screen.findByText('Tela de login')).toBeInTheDocument()
    expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull()
  })
})
