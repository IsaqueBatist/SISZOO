export type SeveridadeAlerta = 'A_VENCER' | 'VENCIDA'

export interface AlertaVacinalItem {
  vacinacaoId: string
  vacinaId: string
  vacinaNome: string
  dataAplicacao: string
  dataValidade: string
  diasRestantes: number
  severidade: SeveridadeAlerta
  veterinarioNome: string | null
}

export interface AlertaVacinalAnimal {
  animalId: string
  animalNome: string
  animalMicrochip: string | null
  animalEspecieNome: string
  animalSexo: string
  animalBaiaNome: string | null
  vacinas: AlertaVacinalItem[]
}
