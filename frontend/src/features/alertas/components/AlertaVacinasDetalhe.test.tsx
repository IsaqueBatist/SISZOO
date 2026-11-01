import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { API_BASE_URL } from '@/lib/env'
import { server } from '@/mocks/server'
import type { AlertaVacinalAnimal, AlertaVacinalItem } from '../types/alertas.types'
import { AlertaVacinasDetalhe } from './AlertaVacinasDetalhe'

function item(vacinacaoId: string, vacinaNome: string, diasRestantes: number): AlertaVacinalItem {
  return {
    vacinacaoId,
    vacinaId: vacinaNome,
    vacinaNome,
    dataAplicacao: '2025-01-01',
    dataValidade: '2026-01-01',
    diasRestantes,
    severidade: diasRestantes < 0 ? 'VENCIDA' : 'A_VENCER',
    veterinarioNome: null,
  }
}

function animal(animalId: string, animalNome: string, vacinas: AlertaVacinalItem[]): AlertaVacinalAnimal {
  return {
    animalId,
    animalNome,
    animalMicrochip: null,
    animalEspecieNome: 'Canino',
    animalSexo: 'M',
    animalBaiaNome: null,
    vacinas,
  }
}

function renderAlertas() {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>
        <AlertaVacinasDetalhe />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function animaisDaTabela() {
  return screen.getAllByRole('row').slice(1).map((linha) => within(linha).getByRole('link').textContent)
}

describe('AlertaVacinasDetalhe', () => {
  beforeEach(() => {
    server.use(
      http.get(`${API_BASE_URL}/alertas/vacinas`, () =>
        HttpResponse.json([
          animal('a1', 'João', [item('v1', 'Antirrábica', 5)]),
          animal('a2', 'Mia', [item('v2', 'V4', -30), item('v3', 'Giárdia', -2)]),
        ]),
      ),
    )
  })

  it('mostra primeiro o que venceu há mais tempo', async () => {
    renderAlertas()

    await screen.findByRole('link', { name: 'João' })
    expect(animaisDaTabela()).toEqual(['Mia', 'Mia', 'João'])
  })

  it('filtra por situação sem mudar os totais do resumo', async () => {
    const user = userEvent.setup()
    renderAlertas()
    await screen.findByRole('link', { name: 'João' })

    await user.selectOptions(screen.getByLabelText('Filtrar por situação'), 'A vencer')

    expect(animaisDaTabela()).toEqual(['João'])
    expect(screen.getByText('3 vacinas em alerta')).toBeInTheDocument()
  })

  it('busca por animal ou vacina sem depender de acento', async () => {
    const user = userEvent.setup()
    renderAlertas()
    await screen.findByRole('link', { name: 'João' })

    await user.type(screen.getByLabelText('Buscar alertas de vacina'), 'joao')
    expect(animaisDaTabela()).toEqual(['João'])

    await user.clear(screen.getByLabelText('Buscar alertas de vacina'))
    await user.type(screen.getByLabelText('Buscar alertas de vacina'), 'giardia')
    expect(animaisDaTabela()).toEqual(['Mia'])
  })

  it('sem resultado, explica e oferece limpar', async () => {
    const user = userEvent.setup()
    renderAlertas()
    await screen.findByRole('link', { name: 'João' })

    await user.type(screen.getByLabelText('Buscar alertas de vacina'), 'inexistente')

    expect(screen.getByText('Nenhum alerta encontrado')).toBeInTheDocument()
    await user.click(screen.getAllByRole('button', { name: 'Limpar filtros' })[0])
    expect(animaisDaTabela()).toHaveLength(3)
  })
})
