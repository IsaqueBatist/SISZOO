export type EstadoLotacao = 'disponivel' | 'atencao' | 'superlotada'

export function calcularPercentual(ocupacao: number, capacidade: number): number {
  if (capacidade <= 0) return ocupacao > 0 ? 100 : 0
  return Math.round((ocupacao / capacidade) * 100)
}

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
