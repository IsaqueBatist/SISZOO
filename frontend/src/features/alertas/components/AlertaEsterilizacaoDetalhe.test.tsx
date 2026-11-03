import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { API_BASE_URL } from '@/lib/env'
import { server } from '@/mocks/server'
import type { AlertaEsterilizacaoAnimal } from '../types/alertas.types'
import { AlertaEsterilizacaoDetalhe } from './AlertaEsterilizacaoDetalhe'

function animal(animalId: string, animalNome: string, horasDesdeEntrada: number): AlertaEsterilizacaoAnimal {
  return {
    animalId,
    animalNome,
    animalMicrochip: `9850000000000${animalId}`,
    animalEspecieNome: 'Canino',
    animalSexo: 'macho',
    animalBaiaNome: 'Canil 1',
    animalStatusNome: 'Em tratamento',
    dataEntrada: '2026-01-01T09:00:00',
    horasDesdeEntrada,
  }
}

function renderAlerta() {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>
        <AlertaEsterilizacaoDetalhe />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('AlertaEsterilizacaoDetalhe', () => {
  beforeEach(() => {
    server.use(
      http.get(`${API_BASE_URL}/alertas/esterilizacao`, () =>
        HttpResponse.json([animal('1', 'Bidu', 100), animal('2', 'Mel', 73)]),
      ),
    )
  })

  it('lista os animais com o tempo desde a entrada e link para a ficha', async () => {
    renderAlerta()

    const link = await screen.findByRole('link', { name: 'Bidu' })
    expect(link).toHaveAttribute('href', '/animais/1')
    const linha = link.closest('tr') as HTMLElement
    expect(within(linha).getByText(/há 4 dias/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '2 animais com esterilização pendente' })).toBeInTheDocument()
  })

  it('filtra por nome sem mudar o total do resumo', async () => {
    renderAlerta()
    await screen.findByRole('link', { name: 'Bidu' })

    await userEvent.type(screen.getByLabelText('Buscar alertas de esterilização'), 'mel')

    expect(screen.queryByRole('link', { name: 'Bidu' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Mel' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '2 animais com esterilização pendente' })).toBeInTheDocument()
  })

  it('mostra estado vazio quando nenhum animal passou de 72 horas', async () => {
    server.use(http.get(`${API_BASE_URL}/alertas/esterilizacao`, () => HttpResponse.json([])))
    renderAlerta()

    expect(await screen.findByText('Nenhum animal com esterilização pendente no momento')).toBeInTheDocument()
  })
})
