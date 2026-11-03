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

    expect(await screen.findByText('Ocupação por baia')).toBeInTheDocument()
    expect(await screen.findByText('Resultados laboratoriais')).toBeInTheDocument()
    expect(await screen.findByText('Casos suspeitos')).toBeInTheDocument()
    expect(await screen.findByText('Raiva por espécie')).toBeInTheDocument()
    expect(await screen.findByText('Por patologia')).toBeInTheDocument()

    const selos = await screen.findAllByText('Dados de demonstração')
    expect(selos).toHaveLength(2)

    const cardBaia = screen.getByText('Ocupação por baia').closest('.card') as HTMLElement
    expect(cardBaia.textContent).not.toContain('Dados de demonstração')
  })
})
