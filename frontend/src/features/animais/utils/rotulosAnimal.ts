import type { TipoDestinoTransferencia } from '../types/animais.types'

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

export const TIPOS_DESTINO_TRANSFERENCIA: { valor: TipoDestinoTransferencia; label: string }[] = [
  { valor: 'ORGAO_PUBLICO', label: 'Órgão público' },
  { valor: 'ENTIDADE_PROTECAO', label: 'Entidade de proteção animal' },
  { valor: 'OUTRO_CCZ', label: 'Outro CCZ' },
  { valor: 'OUTRO', label: 'Outro' },
]

export function formatarTipoDestinoTransferencia(tipo: TipoDestinoTransferencia | null | undefined): string {
  return TIPOS_DESTINO_TRANSFERENCIA.find((item) => item.valor === tipo)?.label ?? '—'
}
