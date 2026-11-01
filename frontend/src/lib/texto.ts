export function normalizarBusca(texto: string): string {
  return texto.normalize('NFD').replace(/\p{M}/gu, '').trim().toLowerCase()
}

export const semEspacos = (v: unknown) => (typeof v === 'string' ? v.trim() || undefined : v)
