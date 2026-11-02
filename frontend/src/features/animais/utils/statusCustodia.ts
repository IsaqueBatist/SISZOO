import type { Animal } from '../types/animais.types'

export const STATUS_FORA_DA_CUSTODIA = ['adotado', 'obito_natural', 'obito_eutanasia', 'transferido']

export function animalSobCustodia(animal: Animal): boolean {
  return !STATUS_FORA_DA_CUSTODIA.includes(animal.statusCodigo)
}
