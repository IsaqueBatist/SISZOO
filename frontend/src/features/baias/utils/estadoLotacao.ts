export type EstadoLotacao = 'disponivel' | 'atencao' | 'superlotada'

// capacidade === 0 não deve gerar Infinity/NaN. Sem animais, trata como
// disponível (0%); com algum animal alocado, não há proporção calculável mas
// o estado é logicamente de superlotação (100%) — não "disponível".
export function calcularPercentual(ocupacao: number, capacidade: number): number {
  if (capacidade <= 0) return ocupacao > 0 ? 100 : 0
  return Math.round((ocupacao / capacidade) * 100)
}

// Limiares confirmados em docs/prototipo/baias.html (funções `tone`/
// `statusLabel`): 100%+ é superlotada (não só acima de 100%), 80–99% é
// atenção ("Próx. limite"), abaixo disso é disponível.
export function estadoLotacao(ocupacao: number, capacidade: number): EstadoLotacao {
  const pct = calcularPercentual(ocupacao, capacidade)
  if (pct >= 100) return 'superlotada'
  if (pct >= 80) return 'atencao'
  return 'disponivel'
}
