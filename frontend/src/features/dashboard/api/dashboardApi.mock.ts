import type { DashboardKpis } from '../types/dashboard.types'

// Latência simulada para o skeleton ser visível e o estado de loading ser
// testável — mesmo valor usado em features/graficos/api/graficosApi.mock.ts.
const LATENCIA_MOCK_MS = 300

// Números do protótipo (docs/prototipo/dashboard.html): 147 animais (123
// cães, 24 gatos), 84% vacinados (123 de 147), 8 adoções no mês (meta 12),
// 4 ocorrências abertas hoje.
const KPIS_MOCK: DashboardKpis = {
  animais: { total: 147, caninos: 123, felinos: 24, variacaoSemanal: 12 },
  vacinacao: { percentualVacinados: 84, vacinados: 123, total: 147, variacaoSemanalPontos: 5.2 },
  adocoes: { noMes: 8, metaMensal: 12, variacaoSemanal: 2 },
  ocorrencias: { abertasHoje: 4, mediaPorHora: 1, variacaoSemanal: -2 },
}

export function buscarKpisDashboardMock(): Promise<DashboardKpis> {
  return new Promise((resolve) => setTimeout(() => resolve(KPIS_MOCK), LATENCIA_MOCK_MS))
}
