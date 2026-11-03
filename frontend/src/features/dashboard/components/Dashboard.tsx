import { Suspense, lazy, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon, type IconName } from '@/components/layout/Icon'
import { ErroComRetry } from '@/components/layout/ErroComRetry'
import { MontarQuandoVisivel } from '@/components/layout/MontarQuandoVisivel'
import { Skeleton } from '@/components/layout/Skeleton'
import { SeloDadosMock } from '@/components/layout/SeloDadosMock'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { hojeEmItu, hojePorExtensoEmItu } from '@/lib/datas'
import { podeAcessar, type RoleKey } from '@/lib/nav'
import { useLinhaClicavel } from '@/lib/useLinhaClicavel'
import { useTelaEstreita } from '@/lib/useTelaEstreita'
import { kpisUsamMock } from '../api/dashboardApi'
import { useKpisDashboardQuery } from '../hooks/useDashboardKpis'
import {
  REGISTROS_POR_PENDENCIA,
  usePendenciasDashboard,
  type Pendencia,
  type TomPendencia,
} from '../hooks/usePendenciasDashboard'
import { mapearKpisParaCards, type KpiCardData } from '../utils/kpiCards'
import './Dashboard.css'

const GraficosDashboard = lazy(() =>
  import('@/features/graficos/components/GraficosDashboard').then((m) => ({ default: m.GraficosDashboard })),
)

const ATALHOS_POR_PERFIL: Record<RoleKey, { to: string; rotulo: string }[]> = {
  admin: [
    { to: '/ocorrencias/novo', rotulo: 'Registrar ocorrência' },
    { to: '/animais/novo', rotulo: 'Novo animal' },
  ],
  vet: [
    { to: '/animais/novo', rotulo: 'Novo animal' },
    { to: '/processos/novo', rotulo: 'Novo processo' },
  ],
  agente: [
    { to: '/ocorrencias/novo', rotulo: 'Registrar ocorrência' },
    { to: '/processos/novo', rotulo: 'Novo processo' },
  ],
  sem_perfil: [],
}

const ICONE_POR_TOM: Record<TomPendencia, IconName> = {
  danger: 'alert',
  warning: 'alert',
  info: 'bell',
}

const ROTULO_POR_TOM: Record<TomPendencia, string> = {
  danger: 'Crítico',
  warning: 'Atenção',
  info: 'Acompanhar',
}

function ItemPendencia({ pendencia }: { pendencia: Pendencia }) {
  const propsDaLinha = useLinhaClicavel()
  const excedente = pendencia.total - pendencia.registros.length
  const clicavel = pendencia.para ? propsDaLinha(pendencia.para) : { className: '' }

  return (
    <li {...clicavel} className={`pendencia ${pendencia.tom} ${clicavel.className}`.trim()}>
      <span className="pendencia-ico" aria-hidden="true">
        <Icon name={ICONE_POR_TOM[pendencia.tom]} size={16} />
      </span>
      <div className="pendencia-corpo">
        <div className="pendencia-titulo">
          <span className={`pendencia-selo ${pendencia.tom}`}>{ROTULO_POR_TOM[pendencia.tom]}</span>
          {pendencia.para ? <Link to={pendencia.para}>{pendencia.titulo}</Link> : <span>{pendencia.titulo}</span>}
        </div>
        <div className="pendencia-desc">{pendencia.descricao}</div>
        {pendencia.registros.length > 0 && (
          <ul className="pendencia-registros" aria-label={`Registros: ${pendencia.titulo}`}>
            {pendencia.registros.map((registro) => (
              <li key={registro.id} className={registro.classe ? `alert-desc-item ${registro.classe}` : undefined}>
                {registro.para ? <Link to={registro.para}>{registro.rotulo}</Link> : <strong>{registro.rotulo}</strong>}
                {registro.detalhe && <span className="pendencia-detalhe"> ({registro.detalhe})</span>}
              </li>
            ))}
            {excedente > 0 && <li className="pendencia-mais">e mais {excedente}</li>}
          </ul>
        )}
      </div>
      {pendencia.para && (
        <span className="pendencia-acao" aria-hidden="true">
          {pendencia.rotuloLink}
          <Icon name="chevronRight" size={14} />
        </span>
      )}
    </li>
  )
}

function ListaPendencias({
  pendencias,
  carregando,
  vazio,
}: {
  pendencias: Pendencia[]
  carregando: boolean
  vazio: string
}) {
  if (pendencias.length === 0 && carregando) {
    return (
      <ul className="pendencias">
        {[0, 1].map((indice) => (
          <li className="pendencia" key={indice}>
            <span />
            <Skeleton width="70%" height={16} />
          </li>
        ))}
      </ul>
    )
  }
  if (pendencias.length === 0) {
    return (
      <p className="pendencias-vazio">
        <Icon name="check" size={16} />
        {vazio}
      </p>
    )
  }
  return (
    <ul className="pendencias">
      {pendencias.map((pendencia) => (
        <ItemPendencia key={pendencia.chave} pendencia={pendencia} />
      ))}
    </ul>
  )
}

function destinoDoIndicador(kpi: KpiCardData, roleKey: RoleKey): string | undefined {
  if (!kpi.para || (kpi.modulo && !podeAcessar(roleKey, kpi.modulo))) return undefined
  return kpi.para.replaceAll('{hoje}', hojeEmItu())
}

function Indicador({ kpi, roleKey }: { kpi: KpiCardData; roleKey: RoleKey }) {
  const destino = destinoDoIndicador(kpi, roleKey)
  const conteudo = (
    <>
      <div className="kpi-head">
        <span className="kpi-label">{kpi.label}</span>
        {kpi.isMock && <SeloDadosMock />}
      </div>
      <div className="kpi-value">
        {kpi.value}
        {kpi.unit ? <span className="unit">{kpi.unit}</span> : null}
      </div>
      <div className="kpi-foot">
        <span>{kpi.foot}</span>
      </div>
      {destino && kpi.rotuloLink && <span className="kpi-link-rotulo">{kpi.rotuloLink}</span>}
    </>
  )
  return destino ? (
    <Link to={destino} className="kpi kpi-link">
      {conteudo}
    </Link>
  ) : (
    <div className="kpi">{conteudo}</div>
  )
}

export function Dashboard() {
  const { roleKey } = useAuth()
  const atalhos = ATALHOS_POR_PERFIL[roleKey]
  const { data: kpis, isLoading: kpisCarregando, isError: kpisComErro, refetch: refazerKpis } = useKpisDashboardQuery()
  const kpisMockados = kpisUsamMock()
  const cards = kpis ? mapearKpisParaCards(kpis, kpisMockados) : []
  const { atencao, acompanhamento, falhas, carregando } = usePendenciasDashboard(roleKey)
  const totalAtencao = atencao.reduce((soma, pendencia) => soma + pendencia.total, 0)
  const telaEstreita = useTelaEstreita()
  const [acompanhamentoEscolhido, setAcompanhamentoEscolhido] = useState<boolean | null>(null)
  const acompanhamentoAberto = acompanhamentoEscolhido ?? !telaEstreita

  return (
    <>
      <div className="page-header">
        <div className="title-block">
          <h1>Início</h1>
          <p className="subtitle dashboard-data">{hojePorExtensoEmItu()}</p>
        </div>
        {atalhos.length > 0 && (
          <div className="actions">
            {atalhos.map((atalho, indice) => (
              <Link key={atalho.to} to={atalho.to} className={`btn ${indice === 0 ? 'btn-primary' : 'btn-outline'}`}>
                <Icon name="plus" size={14} />
                {atalho.rotulo}
              </Link>
            ))}
          </div>
        )}
      </div>

      {falhas.map((falha) => (
        <ErroComRetry key={falha.chave} mensagem={falha.mensagem} onTentarNovamente={falha.tentarNovamente} />
      ))}

      <div className="dashboard-pendencias">
        <section className="card" aria-labelledby="titulo-requer-atencao">
          <div className="card-header">
            <h2 id="titulo-requer-atencao">Requer atenção</h2>
            {atencao.length > 0 && (
              <span className="sub">
                {totalAtencao} {totalAtencao === 1 ? 'registro' : 'registros'}
              </span>
            )}
          </div>
          <ListaPendencias pendencias={atencao} carregando={carregando} vazio="Nada urgente no momento." />
        </section>

        <section className="card" aria-labelledby="titulo-acompanhamento">
          <div className="card-header">
            <h2 id="titulo-acompanhamento">Acompanhamento</h2>
            {telaEstreita ? (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                aria-expanded={acompanhamentoAberto}
                aria-controls="lista-acompanhamento"
                onClick={() => setAcompanhamentoEscolhido(!acompanhamentoAberto)}
              >
                {acompanhamentoAberto ? 'Ocultar' : `Mostrar ${acompanhamento.length} ${acompanhamento.length === 1 ? 'item' : 'itens'}`}
              </button>
            ) : (
              <span className="sub">Até {REGISTROS_POR_PENDENCIA} registros por item</span>
            )}
          </div>
          <div id="lista-acompanhamento" hidden={!acompanhamentoAberto}>
            <ListaPendencias pendencias={acompanhamento} carregando={carregando} vazio="Nada em acompanhamento." />
          </div>
        </section>
      </div>

      <section aria-labelledby="titulo-indicadores">
        <div className="section-header">
          <h2 id="titulo-indicadores">Indicadores</h2>
          {kpisMockados && <SeloDadosMock />}
        </div>
        {kpisComErro ? (
          <ErroComRetry mensagem="Não foi possível carregar os indicadores." onTentarNovamente={refazerKpis} />
        ) : (
          <div className="kpi-grid">
            {kpisCarregando
              ? [0, 1, 2, 3].map((indice) => (
                  <div className="kpi" key={indice}>
                    <Skeleton width="60%" height={14} />
                    <Skeleton width="40%" height={28} />
                  </div>
                ))
              : cards.map((kpi) => <Indicador key={kpi.label} kpi={kpi} roleKey={roleKey} />)}
          </div>
        )}
      </section>

      <MontarQuandoVisivel alturaReservada={220}>
        <Suspense fallback={<Skeleton width="100%" height={220} />}>
          <GraficosDashboard />
        </Suspense>
      </MontarQuandoVisivel>
    </>
  )
}
