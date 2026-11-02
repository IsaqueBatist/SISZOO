export function formatarSexo(sexo: string): string {
  if (sexo === 'macho') return 'Macho'
  if (sexo === 'femea') return 'Fêmea'
  return 'Não identificado'
}

export function formatarPorte(porte: string | null): string {
  if (porte === 'pequeno') return 'Pequeno'
  if (porte === 'medio') return 'Médio'
  if (porte === 'grande') return 'Grande'
  return '—'
}
