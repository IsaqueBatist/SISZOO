import type { PendenciaAnimal } from '../types/animais.types'

export interface DescricaoPendencia {
  rotulo: string
  regra: string
}

export const PENDENCIAS_ANIMAL: Record<PendenciaAnimal, DescricaoPendencia> = {
  ficha_incompleta: {
    rotulo: 'Ficha incompleta',
    regra: 'Animais sob custódia sem microchip ou sem vacinação vigente.',
  },
  sem_avaliacao_30d: {
    rotulo: 'Sem avaliação há 30 dias',
    regra: 'Animais sob custódia sem procedimento registrado nos últimos 30 dias.',
  },
  nao_castrado: {
    rotulo: 'Disponível e não castrado',
    regra: 'Animais disponíveis para adoção que ainda não foram castrados.',
  },
  medicacao_ativa: {
    rotulo: 'Medicação terminando',
    regra: 'Animais sob custódia com prescrição ativa que termina nos próximos 7 dias.',
  },
}

export const CODIGOS_PENDENCIA_ANIMAL = Object.keys(PENDENCIAS_ANIMAL) as PendenciaAnimal[]

export function ehPendenciaAnimal(valor: string | null | undefined): valor is PendenciaAnimal {
  return !!valor && valor in PENDENCIAS_ANIMAL
}
