import type { Baia } from '@/features/animais/types/animais.types'
import { calcularPercentual, estadoLotacao, type EstadoLotacao } from '@/features/baias/utils/estadoLotacao'

export interface OcupacaoBaiaDatum {
  baiaId: string
  nome: string
  ocupacaoAtual: number
  capacidade: number
  percentual: number
  estado: EstadoLotacao
}

export function mapearOcupacaoBaia(baias: Baia[]): OcupacaoBaiaDatum[] {
  return baias
    .filter((baia) => baia.ativa)
    .map((baia) => ({
      baiaId: baia.id,
      nome: baia.nome,
      ocupacaoAtual: baia.ocupacaoAtual,
      capacidade: baia.capacidade,
      percentual: calcularPercentual(baia.ocupacaoAtual, baia.capacidade),
      estado: estadoLotacao(baia.ocupacaoAtual, baia.capacidade),
    }))
    .sort((a, b) => b.percentual - a.percentual)
}
