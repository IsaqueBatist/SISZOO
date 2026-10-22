import { Suspense, lazy } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '@/components/layout/Icon'
import { ErroComRetry } from '@/components/layout/ErroComRetry'
import { Skeleton } from '@/components/layout/Skeleton'
import { SeloDadosMock } from '@/components/layout/SeloDadosMock'
import type { SeveridadeAlerta } from '@/features/alertas/types/alertas.types'
import { useAlertasVacinaisQuery } from '@/features/alertas/hooks/useAlertas'
import { useKpisDashboardQuery } from '../hooks/useDashboardKpis'
import { useProcessosUrgentesQuery } from '../hooks/useAlertaProcessosUrgentes'
import { mapearKpisParaCards } from '../utils/kpiCards'
import type { AlertaCritico } from '../types/dashboard.types'
import './Dashboard.css'

// Lazy: isola o chunk de `recharts` (pesado) do carregamento inicial do
// dashboard — máquinas do CCZ têm ~2GB RAM (ver CLAUDE.md).
const GraficosDashboard = lazy(() =>
  import('@/features/graficos/components/GraficosDashboard').then((m) => ({ default: m.GraficosDashboard })),
)

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

// Card dedicado pro alerta de vacina (GET /api/alertas/vacinas, com a lista
// de animais) — os outros 5 tipos do DER §3.7 vêm agregados em
// kpis.alertas (T38) e são renderizados por AlertaCriticoGenerico, abaixo.
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

// Os 6 alertas críticos do DER §3.7 chegam todos juntos em kpis.alertas (T38),
// mas vacina_vencendo/vacina_vencida já têm card dedicado acima
// (AlertaCriticoVacinas, com a lista de animais via GET /api/alertas/vacinas)
// — não duplicar aqui, só os outros 5 tipos novos.
const TIPOS_JA_EXIBIDOS_EM_CARD_DEDICADO = new Set(['vacina_vencendo', 'vacina_vencida'])

// Mesmo tom por tipo do protótipo (docs/prototipo/dashboard.html): não deriva
// de `severidade` (info/atencao/critico) porque o protótipo usa classes mais
// granulares que a enum do DER — fiel ao visual já validado, em vez de uma
// conversão aproximada.
const TOM_POR_TIPO_DE_ALERTA: Record<string, string> = {
  sem_avaliacao_30d: 'alert-yellow',
  baia_superlotada: 'warning',
  medicacao_ativa: 'info',
  ficha_incompleta: 'info',
  nao_castrado: 'danger',
}

// Sem link "ver detalhes": diferente do alerta de vacina, estes 5 tipos não
// têm endpoint de lista de itens (só o total agregado) — navegar para uma
// tela vazia seria pior do que não navegar.
function AlertaCriticoGenerico({ alerta }: { alerta: AlertaCritico }) {
  return (
    <div className={`alert ${TOM_POR_TIPO_DE_ALERTA[alerta.tipo] ?? 'info'}`}>
      <span className="bullet" />
      <div className="alert-content">
        <strong>{alerta.titulo}</strong>
        <div className="alert-desc">{alerta.descricao}</div>
      </div>
    </div>
  )
}

export function Dashboard() {
  const { data: kpis, isLoading: kpisCarregando, isError: kpisComErro, refetch: refazerKpis } = useKpisDashboardQuery()
  const cards = kpis ? mapearKpisParaCards(kpis) : []
  // Só os com total > 0: a seção é "Alertas Críticos", não um inventário —
  // mostrar "0 baia(s) superlotada(s)" não ajuda ninguém a agir.
  const alertasGenericos = (kpis?.alertas ?? []).filter(
    (alerta) => !TIPOS_JA_EXIBIDOS_EM_CARD_DEDICADO.has(alerta.tipo) && alerta.total > 0,
  )

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
                    {kpi.isMock && <SeloDadosMock />}
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
          {!kpisCarregando &&
            !kpisComErro &&
            alertasGenericos.map((alerta) => <AlertaCriticoGenerico key={alerta.tipo} alerta={alerta} />)}
        </div>
      </div>

      <div style={{ marginTop: 'var(--space-4)' }}>
        <Suspense fallback={<Skeleton width="100%" height={220} />}>
          <GraficosDashboard />
        </Suspense>
      </div>
    </>
  )
}
