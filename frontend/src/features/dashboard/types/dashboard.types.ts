// `animais` e `ocorrencias` são calculados em tempo real no frontend hoje
// (ver dashboardApi.ts::buscarKpisParciaisReais), a partir de GET /animais e
// GET /ocorrencias já existentes — não dependem do endpoint de KPIs. Só
// `vacinacao`/`adocoes` continuam mockados: não existe hoje endpoint nem
// campo (data de adoção) que permita calculá-los no cliente. Ver
// docs/contratos/dashboard-kpis.md para a especificação completa proposta
// para um futuro GET /api/dashboard/kpis (que poderia, no máximo, otimizar
// os blocos já calculados no cliente numa única query do backend).
//
// Campos de variação são opcionais: nenhum dos blocos reais tem como
// calcular variação semanal hoje (sem endpoint de contagem histórica) — o
// card esconde o delta quando o campo está ausente, em vez de mostrar uma
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

// registradasHoje conta QUALQUER status (não só ABERTA) — "aberta" sugeriria
// filtrar por StatusOcorrencia.ABERTA, mas o KPI é sobre volume de registro
// do dia, independente do status em que a ocorrência está agora.
export interface KpiOcorrencias {
  registradasHoje: number
  mediaPorHora?: number
  variacaoSemanal?: number
}

export interface DashboardKpis {
  animais: KpiAnimais
  vacinacao: KpiVacinacao
  adocoes: KpiAdocoes
  ocorrencias: KpiOcorrencias
}
