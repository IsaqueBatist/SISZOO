import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AuthContext, type AuthContextValue } from '@/features/auth/hooks/authContextValue'
import { API_BASE_URL } from '@/lib/env'
import { server } from '@/mocks/server'
import { OrigemAnimal } from './OrigemAnimal'

function renderOrigem(roleKey: AuthContextValue['roleKey']) {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>
        <AuthContext.Provider value={{ roleKey } as AuthContextValue}>
          <OrigemAnimal animalId="animal-1" />
        </AuthContext.Provider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function origemDevolve(corpo: unknown[]) {
  server.use(http.get(`${API_BASE_URL}/animais/animal-1/origem`, () => HttpResponse.json(corpo)))
}

describe('OrigemAnimal', () => {
  it('lista a ocorrência de origem com link para quem acessa ocorrências', async () => {
    origemDevolve([
      { ocorrenciaId: 'o1', protocolo: '089/2026', sigilosa: false, tipoOcorrenciaNome: 'Animal solto', dataAbertura: '2026-05-20' },
    ])
    renderOrigem('agente')

    const link = await screen.findByRole('link', { name: 'OC 089/2026' })
    expect(link).toHaveAttribute('href', '/ocorrencias/o1')
    expect(link.closest('.kv-row')).toHaveTextContent('OC 089/2026 · Animal solto · 20/05/2026')
  })

  it('em ocorrência sigilosa mostra só o protocolo', async () => {
    origemDevolve([{ ocorrenciaId: 'o2', protocolo: '090/2026', sigilosa: true, tipoOcorrenciaNome: null, dataAbertura: null }])
    renderOrigem('admin')

    const link = await screen.findByRole('link', { name: 'OC 090/2026' })
    expect(link.closest('.kv-row')).toHaveTextContent(/^OcorrênciaOC 090\/2026$/)
  })

  it('para quem não acessa ocorrências mostra o protocolo sem link', async () => {
    origemDevolve([
      { ocorrenciaId: 'o1', protocolo: '089/2026', sigilosa: false, tipoOcorrenciaNome: 'Animal solto', dataAbertura: null },
    ])
    renderOrigem('vet')

    expect(await screen.findByText('OC 089/2026')).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('sem vínculo informa que não há ocorrência de origem', async () => {
    renderOrigem('admin')

    expect(await screen.findByText('Nenhuma ocorrência de origem vinculada.')).toBeInTheDocument()
  })
})
