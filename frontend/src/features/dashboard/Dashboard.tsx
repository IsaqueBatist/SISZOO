import { Icon, type IconName } from '../../components/layout/Icon'
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
    </>
  )
}
