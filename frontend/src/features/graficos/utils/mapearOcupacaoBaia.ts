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

// Ordena por % de ocupação decrescente (replica docs/prototipo/dashboard.html
// — BAIAS.sort((a,b) => b.cur/b.cap - a.cur/a.cap) — diferente do agrupamento
// por tipo usado em GestaoBaias.tsx). Só considera baias ativas (baias
// desativadas não entram no gráfico operacional).
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
