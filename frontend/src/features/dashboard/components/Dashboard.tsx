import { Suspense, lazy } from 'react'
import { Link } from 'react-router-dom'
import { Icon, type IconName } from '@/components/layout/Icon'
import { ErroComRetry } from '@/components/layout/ErroComRetry'
import { MontarQuandoVisivel } from '@/components/layout/MontarQuandoVisivel'
import { Skeleton } from '@/components/layout/Skeleton'
import { SeloDadosMock } from '@/components/layout/SeloDadosMock'
import { useAuth } from '@/features/auth/hooks/useAuth'
import type { SeveridadeAlerta } from '@/features/alertas/types/alertas.types'
import { podeAcessar, type RoleKey } from '@/lib/nav'
import { useAlertasEsterilizacaoQuery, useAlertasVacinaisQuery } from '@/features/alertas/hooks/useAlertas'
import {
  formatarTempoDesdeEntrada,
  HORAS_A_DISPOSICAO_DO_RESPONSAVEL,
} from '@/features/alertas/utils/tempoDesdeEntrada'
import { kpisUsamMock } from '../api/dashboardApi'
import { useKpisDashboardQuery } from '../hooks/useDashboardKpis'
import { useProcessosUrgentesQuery } from '../hooks/useAlertaProcessosUrgentes'
import { mapearKpisParaCards } from '../utils/kpiCards'
import type { AlertaCritico } from '../types/dashboard.types'
import './Dashboard.css'

const GraficosDashboard = lazy(() =>
  import('@/features/graficos/components/GraficosDashboard').then((m) => ({ default: m.GraficosDashboard })),
)

const ATALHOS_POR_PERFIL: Record<RoleKey, { to: string; rotulo: string; icone: IconName }[]> = {
  admin: [
    { to: '/ocorrencias/novo', rotulo: 'Registrar Ocorrência', icone: 'plus' },
    { to: '/animais/novo', rotulo: 'Novo animal', icone: 'plus' },
    { to: '/usuarios', rotulo: 'Usuários', icone: 'users' },
  ],
  vet: [
    { to: '/animais/novo', rotulo: 'Novo animal', icone: 'plus' },
    { to: '/processos/novo', rotulo: 'Novo Processo', icone: 'plus' },
    { to: '/alertas/vacinas', rotulo: 'Vacinas a vencer', icone: 'syringe' },
  ],
  agente: [
    { to: '/ocorrencias/novo', rotulo: 'Registrar Ocorrência', icone: 'plus' },
    { to: '/processos/novo', rotulo: 'Novo Processo', icone: 'plus' },
    { to: '/ocorrencias', rotulo: 'Ver ocorrências', icone: 'alert' },
  ],
  sem_perfil: [],
}

interface ItemAlertaAchatado {
  vacinacaoId: string
  animalNome: string
  vacinaNome: string
  diasRestantes: number
  severidade: SeveridadeAlerta
}

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

function AlertaCriticoVacinas() {
  const { data, isLoading, isError, refetch } = useAlertasVacinaisQuery()

  if (isLoading) {
    return <Skeleton width="100%" height={64} />
  }

  if (isError) {
    return <ErroComRetry mensagem="Não foi possível carregar os alertas de vacina." onTentarNovamente={refetch} />
  }

  const animais = data ?? []
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

function AlertaEsterilizacaoPendente() {
  const { data, isLoading, isError, refetch } = useAlertasEsterilizacaoQuery()

  if (isLoading) {
    return <Skeleton width="100%" height={64} />
  }

  if (isError) {
    return (
      <ErroComRetry mensagem="Não foi possível carregar o alerta de esterilização." onTentarNovamente={refetch} />
    )
  }

  const animais = data ?? []
  if (animais.length === 0) {
    return null
  }

  const exibidos = animais.slice(0, RESUMO_MAX_ITENS)
  const excedente = animais.length - exibidos.length

  return (
    <div className="alert warning">
      <span className="bullet" />
      <div className="alert-content">
        <Link to="/alertas/esterilizacao" style={{ textDecoration: 'none', color: 'inherit' }}>
          <strong>
            {animais.length} {animais.length === 1 ? 'animal' : 'animais'}
          </strong>{' '}
          — recolhido{animais.length === 1 ? '' : 's'} há mais de {HORAS_A_DISPOSICAO_DO_RESPONSAVEL} horas sem
          esterilização
        </Link>
        <div className="alert-desc">
          {exibidos.map((animal, indice) => (
            <span key={animal.animalId}>
              <Link to={`/animais/${animal.animalId}`}>{animal.animalNome}</Link> (
              {formatarTempoDesdeEntrada(animal.horasDesdeEntrada)})
              {indice < exibidos.length - 1 ? '; ' : ''}
            </span>
          ))}
          {excedente > 0 && <span> e mais {excedente}</span>}{' '}
          <Link to="/alertas/esterilizacao">ver todos →</Link>
        </div>
      </div>
    </div>
  )
}

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
          <Link to="/processos?urgente=1">ver todos →</Link>
        </div>
      </div>
    </div>
  )
}

const TIPOS_JA_EXIBIDOS_EM_CARD_DEDICADO = new Set(['vacina_vencendo', 'vacina_vencida', 'esterilizacao_72h'])

const TOM_POR_TIPO_DE_ALERTA: Record<string, string> = {
  sem_avaliacao_30d: 'alert-yellow',
  baia_superlotada: 'warning',
  medicacao_ativa: 'info',
  ficha_incompleta: 'info',
  nao_castrado: 'danger',
}

function AlertaCriticoGenerico({ alerta, linkBaias }: { alerta: AlertaCritico; linkBaias: boolean }) {
  return (
    <div className={`alert ${TOM_POR_TIPO_DE_ALERTA[alerta.tipo] ?? 'info'}`}>
      <span className="bullet" />
      <div className="alert-content">
        <strong>{alerta.titulo}</strong>
        <div className="alert-desc">
          {alerta.descricao}
          {alerta.tipo === 'baia_superlotada' && linkBaias && (
            <>
              {' '}
              <Link to="/baias">ver baias →</Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export function Dashboard() {
  const { roleKey } = useAuth()
  const atalhos = ATALHOS_POR_PERFIL[roleKey]
  const linkBaias = podeAcessar(roleKey, 'baias')
  const acessaAnimais = podeAcessar(roleKey, 'animais')
  const { data: kpis, isLoading: kpisCarregando, isError: kpisComErro, refetch: refazerKpis } = useKpisDashboardQuery()
  const kpisMockados = kpisUsamMock()
  const cards = kpis ? mapearKpisParaCards(kpis, kpisMockados) : []
  const alertasGenericos = (kpis?.alertas ?? []).filter(
    (alerta) => !TIPOS_JA_EXIBIDOS_EM_CARD_DEDICADO.has(alerta.tipo) && alerta.total > 0,
  )
  const alertasCriticos = alertasGenericos.filter((alerta) => alerta.severidade === 'critico')
  const avisos = alertasGenericos.filter((alerta) => alerta.severidade !== 'critico')

  return (
    <>
      <div className="page-header">
        <div className="title-block">
          <h1>Dashboard Operacional</h1>
          <p className="subtitle">Visão geral do Centro de Controle de Zoonoses</p>
        </div>
        {atalhos.length > 0 && (
          <div className="actions">
            {atalhos.map((atalho, indice) => (
              <Link key={atalho.to} to={atalho.to} className={`btn ${indice === 0 ? 'btn-primary' : 'btn-outline'}`}>
                <Icon name={atalho.icone} size={14} />
                {atalho.rotulo}
              </Link>
            ))}
          </div>
        )}
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
          {kpisMockados && <SeloDadosMock />}
        </div>
        <div className="alerts-grid">
          {acessaAnimais && <AlertaCriticoVacinas />}
          <AlertaProcessosUrgentes />
          {acessaAnimais && <AlertaEsterilizacaoPendente />}
          {!kpisCarregando &&
            !kpisComErro &&
            alertasCriticos.map((alerta) => <AlertaCriticoGenerico key={alerta.tipo} alerta={alerta} linkBaias={linkBaias} />)}
        </div>
      </div>

      {!kpisCarregando && !kpisComErro && avisos.length > 0 && (
        <div style={{ marginTop: 'var(--space-4)' }}>
          <div className="section-header">
            <h2>Acompanhamento</h2>
          </div>
          <div className="alerts-grid">
            {avisos.map((alerta) => (
              <AlertaCriticoGenerico key={alerta.tipo} alerta={alerta} linkBaias={linkBaias} />
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: 'var(--space-4)' }}>
        <MontarQuandoVisivel alturaReservada={220}>
          <Suspense fallback={<Skeleton width="100%" height={220} />}>
            <GraficosDashboard />
          </Suspense>
        </MontarQuandoVisivel>
      </div>
    </>
  )
}
