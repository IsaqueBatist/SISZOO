// Rótulos de exibição do sexo e do porte do animal, nas listagens, na ficha e
// nos alertas. Valor desconhecido de sexo é "Não identificado" (terceira opção
// do backend); porte ausente é "—".

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
