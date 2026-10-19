// Gap do design system: só existem cores de badge para 2 das 4 espécies
// (.badge-canine #DCEDC8/#33691E, .badge-feline #B2DFDB/#00695C, ambas
// hardcoded em styles/components.css, sem token em tokens.css, sem nada
// para pnh/quiroptero). Reaproveita os 2 hex existentes e define 2 novos
// (mesma família institucional, tons distintos) para pnh/quiroptero —
// decisão de design a validar com o orientador, não uma extração de token
// já existente.
const CORES_POR_CODIGO: Record<string, string> = {
  canino: '#558B2F', // tom sólido do badge-canine (#DCEDC8/#33691E)
  felino: '#00695C', // tom sólido do badge-feline (#B2DFDB/#00695C)
  pnh: '#8D6E63', // novo — marrom, família terrosa (fauna silvestre)
  quiroptero: '#5E35B1', // novo — violeta, distinto dos demais
}

const COR_FALLBACK = '#9AAABB' // --color-text-muted, para codigo desconhecido

export function corEspecie(codigo: string): string {
  return CORES_POR_CODIGO[codigo] ?? COR_FALLBACK
}
