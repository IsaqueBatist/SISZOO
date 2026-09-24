import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AuthProvider, SESSION_STORAGE_KEY } from '../auth/AuthContext'
import type { Usuario } from '../auth/auth.types'
import { OcorrenciaDetalhe } from './OcorrenciaDetalhe'

// Ids semeados em ../../mocks/handlers.ts (seedOcorrenciasMock).
const OCORRENCIA_ABERTA_ID = 'h5000000-0000-0000-0000-000000000001'
const OCORRENCIA_SIGILOSA_MASCARADA_ID = 'h5000000-0000-0000-0000-000000000002'
const OCORRENCIA_SIGILOSA_ADMIN_ID = 'h5000000-0000-0000-0000-000000000003'
const OCORRENCIA_ENCERRADA_ID = 'h5000000-0000-0000-0000-000000000005'

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
  it('renderiza os dados gerais, denunciante, movimentações e anexos', async () => {
    renderDetalhe(OCORRENCIA_ENCERRADA_ID, ['Administrador'])

    expect(await screen.findByRole('heading', { name: 'Ocorrência 070/2026', level: 1 })).toBeInTheDocument()
    expect(screen.getByText('Escola Municipal Parque das Flores')).toBeInTheDocument()
    expect(screen.getByText('Foto do animal.jpg')).toBeInTheDocument()
  })

  it('mostra o placeholder "Sigiloso" para uma ocorrência sigilosa vista por perfil não-admin, sem quebrar o layout', async () => {
    renderDetalhe(OCORRENCIA_SIGILOSA_MASCARADA_ID, ['Agente Sanitário'])

    await screen.findByRole('heading', { name: 'Ocorrência 090/2026', level: 1 })
    expect(screen.getAllByText('Sigiloso').length).toBeGreaterThan(0)
  })

  it('mostra os dados reais do denunciante para uma ocorrência sigilosa vista por Admin', async () => {
    renderDetalhe(OCORRENCIA_SIGILOSA_ADMIN_ID, ['Administrador'])

    await screen.findByRole('heading', { name: 'Ocorrência 091/2026', level: 1 })
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
})
