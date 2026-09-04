import { Link } from 'react-router-dom'
import { Icon, type IconName } from '../../components/layout/Icon'
import type { SeveridadeAlerta } from '../alertas/alertas.types'
import { useAlertasVacinaisQuery } from '../alertas/useAlertas'
import './Dashboard.css'

interface KpiCardData {
  tone: 'kpi-info' | 'kpi-success' | 'kpi-alert' | 'kpi-danger'
  icon: IconName
  label: string
  value: string
  unit?: string
  foot: string
  delta: string
  deltaDirection: 'up' | 'down'
}

// Dados estáticos iguais ao mock de docs/prototipo/dashboard.html.
// Gráficos e tabelas completos ficam para uma tarefa futura de "tela do dashboard".
const KPIS: KpiCardData[] = [
  {
    tone: 'kpi-info',
    icon: 'paw',
    label: 'Total de Animais',
    value: '147',
    foot: '123 cães · 24 gatos',
    delta: '▲ +12 essa semana',
    deltaDirection: 'up',
  },
  {
    tone: 'kpi-success',
    icon: 'syringe',
    label: 'Vacinados',
    value: '84',
    unit: '%',
    foot: '123 de 147 animais',
    delta: '▲ 5.2% vs semana',
    deltaDirection: 'up',
  },
  {
    tone: 'kpi-alert',
    icon: 'heart',
    label: 'Adoções no Mês',
    value: '8',
    foot: 'Meta mensal: 12',
    delta: '▲ +2 essa semana',
    deltaDirection: 'up',
  },
  {
    tone: 'kpi-danger',
    icon: 'alert',
    label: 'Ocorrências',
    value: '4',
    foot: 'Abertas hoje · média 1 a cada hora',
    delta: '▼ −2 vs semana passada',
    deltaDirection: 'down',
  },
]

interface ItemAlertaAchatado {
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

// Só o card de vacinas usa dado real (GET /api/alertas/vacinas) — os outros
// 5 alertas do protótipo (avaliação, baia, medicação, ficha, castração) não
// têm endpoint ainda, então não entram aqui como card mockado: um número
// inventado numa tela de produção é pior que não ter o card. Cada um entra
// quando ganhar seu próprio endpoint.
function AlertaCriticoVacinas() {
  const { data, isLoading, isError } = useAlertasVacinaisQuery()

  if (isLoading) {
    return (
      <div className="alert info">
        <span className="bullet" />
        <div className="alert-content">Carregando alertas de vacina…</div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="alert danger" role="alert">
        <span className="bullet" />
        <div className="alert-content">Não foi possível carregar os alertas de vacina.</div>
      </div>
    )
  }

  const animais = data ?? []
  // Achata para o nível de vacina (não de animal): a veterinária precisa ver
  // "Rex — Antirrábica venceu há 2d", não só "Rex" — um animal com 2 vacinas
  // em alerta vira 2 linhas aqui, não 1.
  const itens: ItemAlertaAchatado[] = animais.flatMap((animal) =>
    animal.vacinas.map((vacina) => ({
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
  const resumo = itensOrdenados
    .slice(0, RESUMO_MAX_ITENS)
    .map(descreverItem)
    .concat(excedente > 0 ? [`+${excedente} outra${excedente === 1 ? '' : 's'}`] : [])
    .join('; ')

  return (
    <Link
      to="/alertas/vacinas"
      className={`alert ${vencidas.length > 0 ? 'danger' : 'warning'}`}
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <span className="bullet" />
      <div className="alert-content">
        <strong>
          {itens.length} vacina{itens.length === 1 ? '' : 's'}
        </strong>{' '}
        — {partesTitulo.join(', ')}
        <div className="alert-desc">{resumo} — ver detalhes →</div>
      </div>
    </Link>
  )
}

export function Dashboard() {
  return (
    <>
      <div className="page-header">
        <div className="title-block">
          <h1>Dashboard Operacional</h1>
          <p className="subtitle">Visão geral do Centro de Controle de Zoonoses</p>
        </div>
      </div>

      <div className="kpi-grid">
        {KPIS.map((kpi) => (
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
              <span className={`kpi-delta ${kpi.deltaDirection}`}>{kpi.delta}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 'var(--space-4)' }}>
        <div className="section-header">
          <h2>
            <span className="icon" style={{ color: 'var(--color-danger)' }}>
              <Icon name="alert" size={18} />
            </span>
            Alertas Críticos
          </h2>
          <Link to="/alertas/vacinas">Ver todos →</Link>
        </div>
        <div className="alerts-grid">
          <AlertaCriticoVacinas />
        </div>
      </div>
    </>
  )
}
