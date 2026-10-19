import { Link } from 'react-router-dom'
import { Icon } from '@/components/layout/Icon'
import { ErroComRetry } from '@/components/layout/ErroComRetry'
import { Skeleton } from '@/components/layout/Skeleton'
import { SeloDadosMock } from '@/components/layout/SeloDadosMock'
import type { SeveridadeAlerta } from '@/features/alertas/types/alertas.types'
import { useAlertasVacinaisQuery } from '@/features/alertas/hooks/useAlertas'
import { kpisUsamMock } from '../api/dashboardApi'
import { useKpisDashboardQuery } from '../hooks/useDashboardKpis'
import { useProcessosUrgentesQuery } from '../hooks/useAlertaProcessosUrgentes'
import { mapearKpisParaCards } from '../utils/kpiCards'
import './Dashboard.css'

interface ItemAlertaAchatado {
  vacinacaoId: string
  animalNome: string
  vacinaNome: string
  diasRestantes: number
  severidade: SeveridadeAlerta
}

// Quantos itens nomear na descrição do card antes de resumir o resto em
// "+N outras" — o card é um resumo compacto, a lista completa está em
// /alertas/vacinas.
const RESUMO_MAX_ITENS = 3

function descreverItem(item: ItemAlertaAchatado): string {
  const vacina = `${item.animalNome} (${item.vacinaNome})`
  if (item.severidade === 'VENCIDA') {
    return `${vacina} venceu há ${Math.abs(item.diasRestantes)}d`
  }
  return item.diasRestantes === 0 ? `${vacina} vence hoje` : `${vacina} vence em ${item.diasRestantes}d`
}

function IconeSeveridadeVacina({ severidade }: { severidade: SeveridadeAlerta }) {
  return <Icon name={severidade === 'VENCIDA' ? 'alert' : 'bell'} size={12} />
}

// Só o card de vacinas usa dado real (GET /api/alertas/vacinas) — os outros
// 5 alertas do protótipo (avaliação, baia, medicação, ficha, castração) não
// têm endpoint ainda, então não entram aqui como card mockado: um número
// inventado numa tela de produção é pior que não ter o card. Cada um entra
// quando ganhar seu próprio endpoint.
function AlertaCriticoVacinas() {
  const { data, isLoading, isError, refetch } = useAlertasVacinaisQuery()

  if (isLoading) {
    return <Skeleton width="100%" height={64} />
  }

  if (isError) {
    return <ErroComRetry mensagem="Não foi possível carregar os alertas de vacina." onTentarNovamente={refetch} />
  }

  const animais = data ?? []
  // Achata para o nível de vacina (não de animal): a veterinária precisa ver
  // "Rex — Antirrábica venceu há 2d", não só "Rex" — um animal com 2 vacinas
  // em alerta vira 2 linhas aqui, não 1.
  const itens: ItemAlertaAchatado[] = animais.flatMap((animal) =>
    animal.vacinas.map((vacina) => ({
      vacinacaoId: vacina.vacinacaoId,
      animalNome: animal.animalNome,
      vacinaNome: vacina.vacinaNome,
      diasRestantes: vacina.diasRestantes,
      severidade: vacina.severidade,
    })),
  )

  if (itens.length === 0) {
    return (
      <div className="alert success">
        <span className="bullet" />
        <div className="alert-content">Nenhuma vacina vencendo ou vencida nos próximos 7 dias.</div>
      </div>
    )
  }

  const vencidas = itens.filter((item) => item.severidade === 'VENCIDA')
  const aVencer = itens.filter((item) => item.severidade === 'A_VENCER')

  const partesTitulo = [
    vencidas.length > 0 ? `${vencidas.length} vencida${vencidas.length === 1 ? '' : 's'}` : null,
    aVencer.length > 0 ? `${aVencer.length} vencendo em até 7 dias` : null,
  ].filter((parte) => parte !== null)

  // diasRestantes negativo (vencida) sempre fica antes de positivo (a vencer)
  // numa ordenação ascendente simples — não precisa de critério de severidade
  // separado, o mais urgente (mais atrasado, ou mais perto de vencer) vem primeiro.
  const itensOrdenados = [...itens].sort((a, b) => a.diasRestantes - b.diasRestantes)
  const excedente = itensOrdenados.length - RESUMO_MAX_ITENS

  return (
    <div className={`alert ${vencidas.length > 0 ? 'danger' : 'warning'}`}>
      <span className="bullet" />
      <div className="alert-content">
        <Link to="/alertas/vacinas" style={{ textDecoration: 'none', color: 'inherit' }}>
          <strong>
            {itens.length} vacina{itens.length === 1 ? '' : 's'}
          </strong>{' '}
          — {partesTitulo.join(', ')}
        </Link>
        <div className="alert-desc">
          {itensOrdenados.slice(0, RESUMO_MAX_ITENS).map((item) => (
            <span
              key={item.vacinacaoId}
              className={`alert-desc-item ${item.severidade === 'VENCIDA' ? 'severidade-vencida' : 'severidade-a-vencer'}`}
            >
              <IconeSeveridadeVacina severidade={item.severidade} />
              {descreverItem(item)}
            </span>
          ))}
          {excedente > 0 && <span className="alert-desc-item">+{excedente} outra{excedente === 1 ? '' : 's'}</span>}
          {' '}
          <Link to="/alertas/vacinas">ver detalhes →</Link>
        </div>
      </div>
    </div>
  )
}

// Processos com contato humano-animal (regra 18, já aplicada 100% no
// backend) — cada item navega para o detalhe do processo; não há filtro de
// servidor ?urgente= hoje (pedido registrado em
// docs/contratos/processos-filtro-urgente.md), então o "Ver todos" leva à
// lista completa (o backend já ordena urgente primeiro).
function AlertaProcessosUrgentes() {
  const { data, isLoading, isError, refetch } = useProcessosUrgentesQuery()

  if (isLoading) {
    return <Skeleton width="100%" height={64} />
  }

  if (isError) {
    return <ErroComRetry mensagem="Não foi possível carregar os processos urgentes." onTentarNovamente={refetch} />
  }

  const { itens, totalUrgentes } = data ?? { itens: [], totalUrgentes: 0 }

  if (totalUrgentes === 0) {
    return (
      <div className="alert success">
        <span className="bullet" />
        <div className="alert-content">Nenhum processo urgente em aberto.</div>
      </div>
    )
  }

  const exibidos = itens.slice(0, RESUMO_MAX_ITENS)
  const excedente = totalUrgentes - exibidos.length

  return (
    <div className="alert danger" role="alert">
      <span className="bullet" />
      <div className="alert-content">
        <Icon name="alert" size={12} />{' '}
        <strong>
          {totalUrgentes} processo{totalUrgentes === 1 ? '' : 's'} urgente{totalUrgentes === 1 ? '' : 's'}
        </strong>{' '}
        — contato humano-animal
        <div className="alert-desc">
          {exibidos.map((processo, indice) => (
            <span key={processo.id}>
              <Link to={`/processos/${processo.id}`}>
                {processo.protocolo} ({processo.doenca.nome})
              </Link>
              {indice < exibidos.length - 1 ? '; ' : ''}
            </span>
          ))}
          {excedente > 0 && <span> e mais {excedente}</span>}
          {' — '}
          <Link to="/processos">ver todos →</Link>
        </div>
      </div>
    </div>
  )
}

export function Dashboard() {
  const { data: kpis, isLoading: kpisCarregando, isError: kpisComErro, refetch: refazerKpis } = useKpisDashboardQuery()
  const cards = kpis ? mapearKpisParaCards(kpis) : []

  return (
    <>
      <div className="page-header">
        <div className="title-block">
          <h1>Dashboard Operacional</h1>
          <p className="subtitle">Visão geral do Centro de Controle de Zoonoses</p>
        </div>
      </div>

      <div className="section-header">
        <h2>Indicadores</h2>
        {kpisUsamMock() && <SeloDadosMock />}
      </div>

      {kpisComErro ? (
        <ErroComRetry mensagem="Não foi possível carregar os indicadores." onTentarNovamente={refazerKpis} />
      ) : (
        <div className="kpi-grid">
          {kpisCarregando
            ? [0, 1, 2, 3].map((indice) => <Skeleton key={indice} width="100%" height={110} />)
            : cards.map((kpi) => (
                <div className={`kpi ${kpi.tone}`} key={kpi.label}>
                  <div className="kpi-head">
                    <span className="kpi-label">{kpi.label}</span>
                    <span className="kpi-icon">
                      <Icon name={kpi.icon} size={18} />
                    </span>
                  </div>
                  <div className="kpi-value">
                    {kpi.value}
                    {kpi.unit ? <span className="unit">{kpi.unit}</span> : null}
                  </div>
                  <div className="kpi-foot">
                    <span>{kpi.foot}</span>
                    {kpi.delta && <span className={`kpi-delta ${kpi.deltaDirection}`}>{kpi.delta}</span>}
                  </div>
                </div>
              ))}
        </div>
      )}

      <div style={{ marginTop: 'var(--space-4)' }}>
        <div className="section-header">
          <h2>
            <span className="icon" style={{ color: 'var(--color-danger)' }}>
              <Icon name="alert" size={18} />
            </span>
            Alertas Críticos
          </h2>
        </div>
        <div className="alerts-grid">
          <AlertaCriticoVacinas />
          <AlertaProcessosUrgentes />
        </div>
      </div>
    </>
  )
}
