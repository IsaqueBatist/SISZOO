export interface KpiAnimais {
  total: number
  caninos: number
  felinos: number
}

export interface KpiVacinacao {
  percentualVacinados: number
  vacinados: number
  total: number
}

export interface KpiOcorrencias {
  registradasHoje: number
  mediaPorHora?: number | null
}

export interface KpiAdocoes {
  adotados: number
  disponiveis: number
}

export type SeveridadeAlertaCritico = 'info' | 'atencao' | 'critico'

export interface AlertaCritico {
  tipo: string
  severidade: SeveridadeAlertaCritico
  titulo: string
  descricao: string
  total: number
}

export interface DashboardKpisApi {
  animais: KpiAnimais
  vacinacao: KpiVacinacao
  ocorrencias: KpiOcorrencias
  adocoes: KpiAdocoes
  alertas: AlertaCritico[]
}

export type DashboardKpis = DashboardKpisApi
