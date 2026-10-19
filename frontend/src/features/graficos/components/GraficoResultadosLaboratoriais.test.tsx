import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import type { BarraResultadoDatum } from '../utils/mapearGraficos'
import { GraficoResultadosLaboratoriais } from './GraficoResultadosLaboratoriais'

vi.mock('recharts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('recharts')>()
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: ReactNode }) => (
      <div style={{ width: 400, height: 300 }}>{children}</div>
    ),
  }
})

const DADOS: BarraResultadoDatum[] = [
  { codigo: 'esporotricose', doencaNome: 'Esporotricose', positivos: 2, negativos: 3, totalExames: 5 },
]

describe('GraficoResultadosLaboratoriais', () => {
  it('renderiza só as doenças com exame (lista dinâmica), com positivos e negativos', () => {
    render(<GraficoResultadosLaboratoriais dados={DADOS} />)

    expect(screen.getByText(/Esporotricose — positivos: 2/)).toBeInTheDocument()
    expect(screen.getByText(/negativos: 3/)).toBeInTheDocument()
    expect(screen.queryByText(/Raiva/)).not.toBeInTheDocument()
  })

  it('mostra estado vazio quando nenhuma doença tem exame', () => {
    render(<GraficoResultadosLaboratoriais dados={[]} />)
    expect(screen.getByText('Sem dados no período.')).toBeInTheDocument()
  })
})
