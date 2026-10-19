import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import type { DonutDatum } from '../utils/mapearGraficos'
import { GraficoCasosPorDoenca } from './GraficoCasosPorDoenca'

// ResponsiveContainer não mede corretamente em jsdom (ResizeObserver
// ausente) — substitui por um contêiner de tamanho fixo só nos testes.
vi.mock('recharts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('recharts')>()
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: ReactNode }) => (
      <div style={{ width: 400, height: 300 }}>{children}</div>
    ),
  }
})

const DADOS: DonutDatum[] = [
  { codigo: 'raiva', nome: 'Raiva', quantidade: 7, cor: '#C62828' },
  { codigo: 'febre_amarela', nome: 'Febre Amarela', quantidade: 0, cor: '#F9A825' },
]

describe('GraficoCasosPorDoenca', () => {
  it('renderiza a legenda com nome e valor de cada doença, inclusive quantidade 0', () => {
    render(<GraficoCasosPorDoenca dados={DADOS} />)

    expect(screen.getByText('Raiva: 7')).toBeInTheDocument()
    expect(screen.getByText('Febre Amarela: 0')).toBeInTheDocument()
  })

  it('tem aria-label descritivo com os valores por extenso', () => {
    render(<GraficoCasosPorDoenca dados={DADOS} />)
    expect(screen.getByLabelText(/Casos por doença — Raiva: 7, Febre Amarela: 0/)).toBeInTheDocument()
  })

  it('mostra estado vazio quando todas as quantidades são 0', () => {
    render(<GraficoCasosPorDoenca dados={[{ codigo: 'raiva', nome: 'Raiva', quantidade: 0, cor: '#C62828' }]} />)
    expect(screen.getByText('Sem dados no período.')).toBeInTheDocument()
  })
})
