import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { OcupacaoBaiaDatum } from '../utils/mapearOcupacaoBaia'
import type { EstadoLotacao } from '@/features/baias/utils/estadoLotacao'

interface GraficoOcupacaoBaiaProps {
  dados: OcupacaoBaiaDatum[]
}

// Mesmas cores semânticas de GestaoBaias.tsx/baias.html: verde até 80%,
// laranja (atenção) 80–99%, vermelho (superlotada) 100%+.
const COR_POR_ESTADO: Record<EstadoLotacao, string> = {
  disponivel: '#2E7D32', // --color-success
  atencao: '#F57F17', // --color-alert
  superlotada: '#C62828', // --color-danger
}

export function GraficoOcupacaoBaia({ dados }: GraficoOcupacaoBaiaProps) {
  if (dados.length === 0) {
    return (
      <div className="empty">
        <p>Sem dados no período.</p>
      </div>
    )
  }

  const resumoAria = dados
    .map((item) => `${item.nome}: ${item.ocupacaoAtual} de ${item.capacidade} (${item.percentual}%)`)
    .join('; ')

  return (
    <figure style={{ margin: 0 }} aria-label={`Ocupação por baia — ${resumoAria}`}>
      <ResponsiveContainer width="100%" height={Math.max(dados.length * 36, 120)}>
        <BarChart data={dados} layout="vertical" margin={{ left: 16 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" unit="%" domain={[0, 100]} allowDecimals={false} />
          <YAxis type="category" dataKey="nome" width={100} />
          <Tooltip />
          <Bar dataKey="percentual" name="Ocupação" isAnimationActive={false}>
            {dados.map((item) => (
              <Cell key={item.baiaId} fill={COR_POR_ESTADO[item.estado]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <ul className="chart-legend">
        {dados.map((item) => (
          <li key={item.baiaId}>
            <span className="chart-legend-dot" style={{ background: COR_POR_ESTADO[item.estado] }} />
            {item.nome}: {item.ocupacaoAtual}/{item.capacidade} ({item.percentual}%)
          </li>
        ))}
      </ul>
    </figure>
  )
}
