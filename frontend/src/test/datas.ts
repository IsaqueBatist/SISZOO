// Soma dias a uma data ISO (AAAA-MM-DD) em UTC, sem hora — para montar
// fronteiras de data nos testes sem sofrer deslocamento de fuso horário.
export function adicionarDiasIso(isoDate: string, dias: number): string {
  const [ano, mes, dia] = isoDate.split('-').map(Number)
  return new Date(Date.UTC(ano, mes - 1, dia + dias)).toISOString().slice(0, 10)
}
