// Contrato PROPOSTO para GET /api/dashboard/kpis — endpoint ainda não existe
// no backend (pacote com.siszoo.relatorios é um esqueleto vazio). Ver
// docs/contratos/dashboard-kpis.md para a especificação a validar com o
// backend antes de implementar a chamada real.
//
// Campos de variação são opcionais: quando o backend não tiver uma janela de
// comparação disponível (ex. primeira semana de operação), omite o campo em
// vez de mandar 0 — o card esconde o delta nesse caso, em vez de mostrar uma
// variação falsa de "0%".

export interface KpiAnimais {
  total: number
  caninos: number
  felinos: number
  variacaoSemanal?: number
}

export interface KpiVacinacao {
  percentualVacinados: number // 0-100
  vacinados: number
  total: number
  variacaoSemanalPontos?: number // pontos percentuais
}

export interface KpiAdocoes {
  noMes: number
  metaMensal: number
  variacaoSemanal?: number
}

export interface KpiOcorrencias {
  abertasHoje: number
  mediaPorHora?: number
  variacaoSemanal?: number
}

export interface DashboardKpis {
  animais: KpiAnimais
  vacinacao: KpiVacinacao
  adocoes: KpiAdocoes
  ocorrencias: KpiOcorrencias
}
