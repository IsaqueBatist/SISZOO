import { useBaiasQuery } from '@/features/animais/hooks/useAnimais'
import { ErroComRetry } from '@/components/layout/ErroComRetry'
import { Skeleton } from '@/components/layout/Skeleton'
import { SeloDadosMock } from '@/components/layout/SeloDadosMock'
import { graficosUsamMock } from '../api/graficosApi'
import { useGraficosQuery } from '../hooks/useGraficos'
import { mapearCasosPorDoenca, mapearRaivaPorEspecie, mapearResultadosLaboratoriais } from '../utils/mapearGraficos'
import { mapearOcupacaoBaia } from '../utils/mapearOcupacaoBaia'
import { GraficoCasosPorDoenca } from './GraficoCasosPorDoenca'
import { GraficoOcupacaoBaia } from './GraficoOcupacaoBaia'
import { GraficoRaivaPorEspecie } from './GraficoRaivaPorEspecie'
import { GraficoResultadosLaboratoriais } from './GraficoResultadosLaboratoriais'

const ALTURA_SKELETON = 220

// "Ocupação por Baia" usa dado 100% real hoje (GET /baias, mesmo endpoint de
// Gestão de Baias) — por isso não entra no toggle VITE_USE_MOCK_GRAFICOS nem
// mostra o selo de demonstração, diferente dos outros dois cards.
function CardOcupacaoBaia() {
  const { data, isLoading, isError, refetch } = useBaiasQuery()

  return (
    <div className="card">
      <div className="card-header">
        <h3>Ocupação por Baia</h3>
        <span className="sub">Ordenado por % de ocupação</span>
      </div>
      <div className="card-body">
        {isLoading && <Skeleton width="100%" height={ALTURA_SKELETON} />}
        {isError && (
          <ErroComRetry mensagem="Não foi possível carregar a ocupação das baias." onTentarNovamente={refetch} />
        )}
        {!isLoading && !isError && <GraficoOcupacaoBaia dados={mapearOcupacaoBaia(data ?? [])} />}
      </div>
    </div>
  )
}

interface CardComDadosDeGraficosProps {
  query: ReturnType<typeof useGraficosQuery>
}

function CardResultadosLaboratoriais({ query }: CardComDadosDeGraficosProps) {
  const { data, isLoading, isError, refetch } = query

  return (
    <div className="card">
      <div className="card-header">
        <h3>Resultados Laboratoriais</h3>
        {graficosUsamMock() && <SeloDadosMock />}
      </div>
      <div className="card-body">
        {isLoading && <Skeleton width="100%" height={ALTURA_SKELETON} />}
        {isError && (
          <ErroComRetry mensagem="Não foi possível carregar os resultados laboratoriais." onTentarNovamente={refetch} />
        )}
        {!isLoading && !isError && data && (
          <GraficoResultadosLaboratoriais dados={mapearResultadosLaboratoriais(data.resultadosPorDoenca)} />
        )}
      </div>
    </div>
  )
}

function CardCasosSuspeitos({ query }: CardComDadosDeGraficosProps) {
  const { data, isLoading, isError, refetch } = query

  return (
    <div className="card">
      <div className="card-header">
        <h3>Casos Suspeitos</h3>
        {graficosUsamMock() && <SeloDadosMock />}
      </div>
      <div className="card-body">
        {isLoading && <Skeleton width="100%" height={ALTURA_SKELETON} />}
        {isError && (
          <ErroComRetry mensagem="Não foi possível carregar os casos suspeitos." onTentarNovamente={refetch} />
        )}
        {!isLoading && !isError && data && (
          <div className="donuts-pair">
            <div className="donut-block">
              <div className="donut-title">Raiva por Espécie</div>
              <GraficoRaivaPorEspecie dados={mapearRaivaPorEspecie(data.casosRaivaPorEspecie)} />
            </div>
            <div className="donut-block">
              <div className="donut-title">Por Patologia</div>
              <GraficoCasosPorDoenca dados={mapearCasosPorDoenca(data.casosPorDoenca)} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Único ponto de React.lazy do T40 (ver Dashboard.tsx): os 4 componentes de
// gráfico acima são import estático comum — todos entram no mesmo chunk de
// `recharts` quando este módulo carrega. Export nomeado (não default), no
// mesmo padrão de lazy-loading já usado em routes/AppRoutes.tsx.
export function GraficosDashboard() {
  const query = useGraficosQuery()

  return (
    <div className="charts-row">
      <CardOcupacaoBaia />
      <CardResultadosLaboratoriais query={query} />
      <CardCasosSuspeitos query={query} />
    </div>
  )
}
