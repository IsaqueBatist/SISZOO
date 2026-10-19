import { useQuery } from '@tanstack/react-query'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ErroComRetry } from '@/components/layout/ErroComRetry'
import { Skeleton } from '@/components/layout/Skeleton'
import { listarOcorrencias } from '../api/ocorrenciasApi'
import { mapearOcorrenciasPorBairro } from '../utils/mapearOcorrenciasPorBairro'

// Paliativo até existir um endpoint de agregação por bairro — pedido
// registrado em docs/contratos/distribuicao-ocorrencias-bairro.md.
const LIMITE_OCORRENCIAS_GRAFICO = 500

const COR_BARRA = '#1565C0' // --color-info — métrica única, não categoria por cor

function useOcorrenciasPorBairroQuery() {
  return useQuery({
    queryKey: ['ocorrencias', 'grafico-bairro'],
    queryFn: () => listarOcorrencias({ pagina: 0, tamanho: LIMITE_OCORRENCIAS_GRAFICO }),
  })
}

export function GraficoOcorrenciasPorBairro() {
  const { data, isLoading, isError, refetch } = useOcorrenciasPorBairroQuery()

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
        {!isLoading && !isError && data && <ConteudoGrafico itens={data.itens} totalItens={data.totalItens} />}
      </div>
    </div>
  )
}

function ConteudoGrafico({ itens, totalItens }: { itens: { bairro: string }[]; totalItens: number }) {
  const dados = mapearOcorrenciasPorBairro(itens)
  const baseadoEmAmostra = totalItens > itens.length

  if (dados.length === 0) {
    return (
      <div className="empty">
        <p>Sem dados no período.</p>
      </div>
    )
  }

  const resumoAria = dados.map((item) => `${item.bairro}: ${item.quantidade}`).join(', ')

  return (
    <>
      {baseadoEmAmostra && (
        <p className="subtitle" style={{ marginBottom: 'var(--space-3)' }}>
          Baseado nas {itens.length} ocorrências mais recentes (de {totalItens} no total).
        </p>
      )}
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
    </>
  )
}
