import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { BarraResultadoDatum } from '../utils/mapearGraficos'

interface GraficoResultadosLaboratoriaisProps {
  dados: BarraResultadoDatum[]
}

// Cores semânticas do design system (não tokens de doença): positivo/negativo
// são um resultado, não uma categoria de doença.
const COR_POSITIVO = '#C62828' // --color-danger
const COR_NEGATIVO = '#2E7D32' // --color-success

export function GraficoResultadosLaboratoriais({ dados }: GraficoResultadosLaboratoriaisProps) {
  if (dados.length === 0) {
    return (
      <div className="empty">
        <p>Sem dados no período.</p>
      </div>
    )
  }

  const resumoAria = dados
    .map((item) => `${item.doencaNome}: ${item.positivos} positivos, ${item.negativos} negativos`)
    .join('; ')

  return (
    <figure style={{ margin: 0 }} aria-label={`Resultados laboratoriais por doença — ${resumoAria}`}>
      <ResponsiveContainer width="100%" height={Math.max(dados.length * 50, 120)}>
        <BarChart data={dados} layout="vertical" margin={{ left: 16 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" allowDecimals={false} />
          <YAxis type="category" dataKey="doencaNome" width={160} />
          <Tooltip />
          <Bar dataKey="positivos" stackId="resultado" fill={COR_POSITIVO} name="Positivos" isAnimationActive={false} />
          <Bar dataKey="negativos" stackId="resultado" fill={COR_NEGATIVO} name="Negativos" isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
      <ul className="chart-legend">
        {dados.map((item) => (
          <li key={item.codigo}>
            <span className="chart-legend-dot" style={{ background: COR_POSITIVO }} />
            {item.doencaNome} — positivos: {item.positivos}
            <span className="chart-legend-dot" style={{ background: COR_NEGATIVO, marginLeft: 8 }} />
            negativos: {item.negativos}
          </li>
        ))}
      </ul>
    </figure>
  )
}
