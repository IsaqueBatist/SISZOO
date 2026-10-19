import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { GraficosDashboard } from './GraficosDashboard'

vi.mock('recharts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('recharts')>()
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: ReactNode }) => (
      <div style={{ width: 400, height: 300 }}>{children}</div>
    ),
  }
})

function renderGraficosDashboard() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <GraficosDashboard />
    </QueryClientProvider>,
  )
}

describe('GraficosDashboard', () => {
  it('renderiza os 4 gráficos juntos (ocupação de baia real + 3 mockados com selo)', async () => {
    renderGraficosDashboard()

    expect(await screen.findByText('Ocupação por Baia')).toBeInTheDocument()
    expect(await screen.findByText('Resultados Laboratoriais')).toBeInTheDocument()
    expect(await screen.findByText('Casos Suspeitos')).toBeInTheDocument()
    expect(await screen.findByText('Raiva por Espécie')).toBeInTheDocument()
    expect(await screen.findByText('Por Patologia')).toBeInTheDocument()

    // Selo de mock aparece nos 2 cards mockados...
    const selos = await screen.findAllByText('Dados de demonstração')
    expect(selos).toHaveLength(2)

    // ...mas nunca no card de ocupação de baia (dado real).
    const cardBaia = screen.getByText('Ocupação por Baia').closest('.card') as HTMLElement
    expect(cardBaia.textContent).not.toContain('Dados de demonstração')
  })
})
