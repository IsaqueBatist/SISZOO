import type { DashboardKpis } from '../types/dashboard.types'

// Latência simulada para o skeleton ser visível e o estado de loading ser
// testável — mesmo valor usado em features/graficos/api/graficosApi.mock.ts.
const LATENCIA_MOCK_MS = 300

// Só vacinacao/adocoes: animais/ocorrencias já são reais (ver
// dashboardApi.ts::buscarKpisParciaisReais). Números do protótipo
// (docs/prototipo/dashboard.html): 84% vacinados (123 de 147), 8 adoções no
// mês (meta 12).
const VACINACAO_E_ADOCOES_MOCK: Pick<DashboardKpis, 'vacinacao' | 'adocoes'> = {
  vacinacao: { percentualVacinados: 84, vacinados: 123, total: 147, variacaoSemanalPontos: 5.2 },
  adocoes: { noMes: 8, metaMensal: 12, variacaoSemanal: 2 },
}

export function buscarVacinacaoEAdocoesMock(): Promise<Pick<DashboardKpis, 'vacinacao' | 'adocoes'>> {
  return new Promise((resolve) => setTimeout(() => resolve(VACINACAO_E_ADOCOES_MOCK), LATENCIA_MOCK_MS))
}
