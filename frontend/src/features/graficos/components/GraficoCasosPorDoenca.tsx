import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { DonutDatum } from '../utils/mapearGraficos'

interface GraficoCasosPorDoencaProps {
  dados: DonutDatum[]
}

// Legenda própria (lista de texto), não a do Recharts: garante rótulo com
// valor sempre visível (não só em hover) e lido por leitor de tela — a cor
// nunca é o único indicador de categoria.
export function GraficoCasosPorDoenca({ dados }: GraficoCasosPorDoencaProps) {
  const totalCasos = dados.reduce((soma, item) => soma + item.quantidade, 0)

  if (totalCasos === 0) {
    return (
      <div className="empty">
        <p>Sem dados no período.</p>
      </div>
    )
  }

  const resumoAria = dados.map((item) => `${item.nome}: ${item.quantidade}`).join(', ')

  return (
    <figure style={{ margin: 0 }} aria-label={`Casos por doença — ${resumoAria}`}>
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie data={dados} dataKey="quantidade" nameKey="nome" innerRadius={42} outerRadius={70} isAnimationActive={false}>
            {dados.map((item) => (
              <Cell key={item.codigo} fill={item.cor} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
      <ul className="chart-legend">
        {dados.map((item) => (
          <li key={item.codigo}>
            <span className="chart-legend-dot" style={{ background: item.cor }} />
            {item.nome}: {item.quantidade}
          </li>
        ))}
      </ul>
    </figure>
  )
}
