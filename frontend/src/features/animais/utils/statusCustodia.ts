import type { Animal } from '../types/animais.types'

// Espelha StatusAnimal.CODIGOS_FORA_DA_CUSTODIA do backend (RN-A05) — mesma
// regra já aplicada em GET /api/alertas/vacinas. GET /animais sem filtro de
// status devolve TODOS os animais, incluindo adotados/óbitos/transferidos;
// isso filtra para "presente no canil hoje".
export const STATUS_FORA_DA_CUSTODIA = ['adotado', 'obito_natural', 'obito_eutanasia', 'transferido']

export function animalSobCustodia(animal: Animal): boolean {
  return !STATUS_FORA_DA_CUSTODIA.includes(animal.statusCodigo)
}
