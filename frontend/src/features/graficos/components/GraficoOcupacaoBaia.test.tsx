import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import type { OcupacaoBaiaDatum } from '../utils/mapearOcupacaoBaia'
import { GraficoOcupacaoBaia } from './GraficoOcupacaoBaia'

vi.mock('recharts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('recharts')>()
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: ReactNode }) => (
      <div style={{ width: 400, height: 300 }}>{children}</div>
    ),
  }
})

const DADOS: OcupacaoBaiaDatum[] = [
  { baiaId: '1', nome: 'Baia 3', ocupacaoAtual: 2, capacidade: 2, percentual: 100, estado: 'superlotada' },
  { baiaId: '2', nome: 'Baia 1', ocupacaoAtual: 1, capacidade: 4, percentual: 25, estado: 'disponivel' },
]

describe('GraficoOcupacaoBaia', () => {
  it('renderiza ocupação atual, capacidade e percentual de cada baia', () => {
    render(<GraficoOcupacaoBaia dados={DADOS} />)

    expect(screen.getByText('Baia 3: 2/2 (100%)')).toBeInTheDocument()
    expect(screen.getByText('Baia 1: 1/4 (25%)')).toBeInTheDocument()
  })

  it('mostra estado vazio quando não há baias', () => {
    render(<GraficoOcupacaoBaia dados={[]} />)
    expect(screen.getByText('Sem dados no período.')).toBeInTheDocument()
  })
})
