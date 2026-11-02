const CORES_POR_CODIGO: Record<string, string> = {
  canino: '#558B2F',
  felino: '#00695C',
  pnh: '#8D6E63',
  quiroptero: '#5E35B1',
}

const COR_FALLBACK = '#9AAABB'

export function corEspecie(codigo: string): string {
  return CORES_POR_CODIGO[codigo] ?? COR_FALLBACK
}
