export const HORAS_A_DISPOSICAO_DO_RESPONSAVEL = 72

export function formatarTempoDesdeEntrada(horas: number): string {
  const dias = Math.floor(horas / 24)
  if (dias < 1) return `há ${horas} h`
  return dias === 1 ? 'há 1 dia' : `há ${dias} dias`
}
