export type EstadoLotacao = 'disponivel' | 'atencao' | 'superlotada'

// capacidade === 0 não deve gerar Infinity/NaN. Sem animais, trata como
// disponível (0%); com algum animal alocado, não há proporção calculável mas
// o estado é logicamente de superlotação (100%) - não "disponível".
export function calcularPercentual(ocupacao: number, capacidade: number): number {
  if (capacidade <= 0) return ocupacao > 0 ? 100 : 0
  return Math.round((ocupacao / capacidade) * 100)
}

// Espelha com.siszoo.animais.entity.NivelLotacao, a mesma regra do Dashboard e
// do relatório de ocupação: 100% ou mais é superlotada, de 80% a 99% é próximo
// do limite, abaixo disso é normal. Compara sem arredondar: 79,6% não é 80%.
export function estadoLotacao(ocupacao: number, capacidade: number): EstadoLotacao {
  if (ocupacao === 0) return 'disponivel'
  if (ocupacao >= capacidade) return 'superlotada'
  return ocupacao * 100 >= capacidade * 80 ? 'atencao' : 'disponivel'
}

export const ROTULO_LOTACAO: Record<EstadoLotacao, string> = {
  disponivel: 'Normal',
  atencao: 'Próximo do limite',
  superlotada: 'Superlotada',
}
