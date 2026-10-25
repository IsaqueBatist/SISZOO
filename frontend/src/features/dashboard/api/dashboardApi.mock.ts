import type { DashboardKpisApi } from '../types/dashboard.types'

// Latência simulada para o skeleton ser visível e o estado de loading ser
// testável — mesmo valor usado em features/graficos/api/graficosApi.mock.ts.
const LATENCIA_MOCK_MS = 300

// Números do protótipo (docs/prototipo/dashboard.html): 147 animais (123
// cães, 24 gatos), 84% vacinados (123 de 147), 4 ocorrências registradas
// hoje. Alertas replicam o mesmo protótipo (vacinas, avaliação, baia,
// medicação, ficha, castração).
const KPIS_REAIS_MOCK: DashboardKpisApi = {
  animais: { total: 147, caninos: 123, felinos: 24 },
  vacinacao: { percentualVacinados: 84, vacinados: 123, total: 147 },
  ocorrencias: { registradasHoje: 4, mediaPorHora: 1 },
  adocoes: { adotados: 8, disponiveis: 12 },
  alertas: [
    {
      tipo: 'vacina_vencendo',
      severidade: 'atencao',
      titulo: '4 vacina(s) vencendo em até 7 dias',
      descricao: 'Reforços vacinais com vencimento nos próximos 7 dias.',
      total: 4,
    },
    {
      tipo: 'vacina_vencida',
      severidade: 'critico',
      titulo: '1 vacina(s) vencida(s)',
      descricao: 'Reforços vacinais já vencidos.',
      total: 1,
    },
    {
      tipo: 'sem_avaliacao_30d',
      severidade: 'atencao',
      titulo: '3 animal(is) sem avaliação clínica há mais de 30 dias',
      descricao: 'Animais sob custódia sem procedimento registrado nos últimos 30 dias.',
      total: 3,
    },
    {
      tipo: 'baia_superlotada',
      severidade: 'critico',
      titulo: '1 baia(s) superlotada(s)',
      descricao: 'Baias com ocupação igual ou acima da capacidade.',
      total: 1,
    },
    {
      tipo: 'medicacao_ativa',
      severidade: 'info',
      titulo: '7 prescrição(ões) ativa(s) terminando em até 7 dias',
      descricao: 'Prescrições ativas com fim previsto nos próximos 7 dias.',
      total: 7,
    },
    {
      tipo: 'ficha_incompleta',
      severidade: 'info',
      titulo: '2 animal(is) com ficha incompleta',
      descricao: 'Animais sob custódia sem microchip e/ou sem vacinação vigente.',
      total: 2,
    },
    {
      tipo: 'nao_castrado',
      severidade: 'info',
      titulo: '10 animal(is) disponível(is) para adoção não castrado(s)',
      descricao: 'Animais disponíveis para adoção que ainda não foram esterilizados.',
      total: 10,
    },
  ],
}

export function buscarKpisReaisMock(): Promise<DashboardKpisApi> {
  return new Promise((resolve) => setTimeout(() => resolve(KPIS_REAIS_MOCK), LATENCIA_MOCK_MS))
}
