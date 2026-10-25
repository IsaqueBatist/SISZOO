import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ErroComRetry } from '@/components/layout/ErroComRetry'
import { Skeleton } from '@/components/layout/Skeleton'
import { useContagemPorBairroQuery } from '../hooks/useOcorrencias'
import { mapearOcorrenciasPorBairro, type BairroDatum } from '../utils/mapearOcorrenciasPorBairro'

const COR_BARRA = '#1565C0' // --color-info — métrica única, não categoria por cor

// Contagem de todo o histórico agregada no backend (T45,
// docs/contratos/distribuicao-ocorrencias-bairro.md); aqui só se juntam as
// grafias do mesmo bairro e se aplica o Top N.
export function GraficoOcorrenciasPorBairro() {
  const { data, isLoading, isError, refetch } = useContagemPorBairroQuery(mapearOcorrenciasPorBairro)

  return (
    <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
      <div className="card-header">
        <h3>Distribuição de ocorrências por bairro</h3>
      </div>
      <div className="card-body">
        {isLoading && <Skeleton width="100%" height={220} />}
        {isError && (
          <ErroComRetry mensagem="Não foi possível carregar a distribuição por bairro." onTentarNovamente={refetch} />
        )}
        {!isLoading && !isError && data && <ConteudoGrafico dados={data} />}
      </div>
    </div>
  )
}

function ConteudoGrafico({ dados }: { dados: BairroDatum[] }) {
  if (dados.length === 0) {
    return (
      <div className="empty">
        <p>Sem dados no período.</p>
      </div>
    )
  }

  const resumoAria = dados.map((item) => `${item.bairro}: ${item.quantidade}`).join(', ')

  return (
    <figure style={{ margin: 0 }} aria-label={`Distribuição de ocorrências por bairro — ${resumoAria}`}>
      <ResponsiveContainer width="100%" height={Math.max(dados.length * 32, 160)}>
        <BarChart data={dados} layout="vertical" margin={{ left: 16 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" allowDecimals={false} />
          <YAxis type="category" dataKey="bairro" width={120} />
          <Tooltip />
          <Bar dataKey="quantidade" name="Ocorrências" fill={COR_BARRA} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
      <ul className="chart-legend">
        {dados.map((item) => (
          <li key={item.bairro}>
            <span className="chart-legend-dot" style={{ background: COR_BARRA }} />
            {item.bairro}: {item.quantidade}
          </li>
        ))}
      </ul>
    </figure>
  )
}
