// Espelha com.siszoo.alertas.dto do backend.

export type SeveridadeAlerta = 'A_VENCER' | 'VENCIDA'

// Espelha com.siszoo.alertas.dto.AlertaVacinalItemResponse.
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

// Espelha com.siszoo.alertas.dto.AlertaVacinalAnimalResponse.
export interface AlertaVacinalAnimal {
  animalId: string
  animalNome: string
  animalMicrochip: string | null
  animalEspecieNome: string
  animalSexo: string
  animalBaiaNome: string | null
  vacinas: AlertaVacinalItem[]
}
