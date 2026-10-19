import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import type { DonutDatum } from '../utils/mapearGraficos'
import { GraficoRaivaPorEspecie } from './GraficoRaivaPorEspecie'

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
  { codigo: 'canino', nome: 'Canino', quantidade: 10, cor: '#558B2F' },
  { codigo: 'quiroptero', nome: 'Quiróptero', quantidade: 2, cor: '#5E35B1' },
]

describe('GraficoRaivaPorEspecie', () => {
  it('renderiza a legenda com nome e valor de cada espécie', () => {
    render(<GraficoRaivaPorEspecie dados={DADOS} />)

    expect(screen.getByText('Canino: 10')).toBeInTheDocument()
    expect(screen.getByText('Quiróptero: 2')).toBeInTheDocument()
  })

  it('mostra estado vazio quando não há casos', () => {
    render(<GraficoRaivaPorEspecie dados={[]} />)
    expect(screen.getByText('Sem dados no período.')).toBeInTheDocument()
  })
})
