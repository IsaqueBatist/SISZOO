// Espelha com.siszoo.relatorios.dto do backend (T38) — ver
// docs/contratos/dashboard-kpis.md para o contrato completo.
//
// Sem campos de variação semanal: o backend não guarda nenhum snapshot
// histórico de contagem, então não há como calcular um delta real vs. 7 dias
// atrás (decisão registrada no contrato). Fica para uma tarefa futura.

export interface KpiAnimais {
  total: number
  caninos: number
  felinos: number
}

export interface KpiVacinacao {
  percentualVacinados: number // 0-100
  vacinados: number
  total: number
}

// mediaPorHora ausente (não 0) na virada do dia — o card esconde a média
// nesse caso, em vez de mostrar uma conta falsa de "X/0".
export interface KpiOcorrencias {
  registradasHoje: number
  mediaPorHora?: number
}

export type SeveridadeAlertaCritico = 'info' | 'atencao' | 'critico'

// Um dos 6 alertas críticos do DER §3.7 — vacina_vencendo/vacina_vencida
// contam como 2 entradas separadas (mesma severidade do alerta de vacina já
// existente, com.siszoo.alertas), totalizando 7 no array.
export interface AlertaCritico {
  tipo: string
  severidade: SeveridadeAlertaCritico
  titulo: string
  descricao: string
  total: number
}

// Exatamente o que GET /api/dashboard/kpis devolve.
export interface DashboardKpisApi {
  animais: KpiAnimais
  vacinacao: KpiVacinacao
  ocorrencias: KpiOcorrencias
  alertas: AlertaCritico[]
}

// Único bloco sem fonte real: o DER documenta uma tabela `adocao` (com
// `data_adocao`) que nunca foi implementada — sem migration, sem entidade,
// sem rastro em auditoria (ver docs/contratos/dashboard-kpis.md). Continua
// mockado localmente até uma tarefa futura criar essa tabela.
export interface KpiAdocoes {
  noMes: number
  metaMensal: number
}

// O que a UI consome: a resposta real do endpoint + o bloco de adoções
// (sempre mock, ver dashboardApi.ts::buscarAdocoesMock).
export interface DashboardKpis extends DashboardKpisApi {
  adocoes: KpiAdocoes
}
