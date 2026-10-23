import { describe, expect, it } from 'vitest'
import type { Animal } from '../types/animais.types'
import { animalSobCustodia } from './statusCustodia'

function animal(statusCodigo: string): Animal {
  return {
    id: 'id',
    nome: 'Animal',
    especieCodigo: 'canino',
    especieNome: 'Canino',
    sexo: 'macho',
    raca: null,
    coloracao: null,
    pelagem: null,
    porte: null,
    pesoKg: null,
    idadeAprox: null,
    dataNascimentoAprox: null,
    microchip: null,
    esterilizado: false,
    dataEsterilizacao: null,
    statusCodigo,
    statusNome: statusCodigo,
    motivoEntradaCodigo: 'resgate',
    motivoEntradaNome: 'Resgate',
    dataEntrada: '2026-01-01T09:00:00Z',
    baiaId: null,
    baiaNome: null,
    tipoBaiaNome: null,
    fichaCompleta: true,
    fotoUrl: null,
    observacoes: null,
    criadoPorId: 'id',
    criadoPorNome: 'Nome',
    criadoEm: '2026-01-01T09:00:00Z',
    atualizadoEm: '2026-01-01T09:00:00Z',
  }
}

describe('animalSobCustodia', () => {
  it('considera sob custódia os status que não estão em FORA_DA_CUSTODIA', () => {
    expect(animalSobCustodia(animal('disponivel_adocao'))).toBe(true)
    expect(animalSobCustodia(animal('em_tratamento'))).toBe(true)
    expect(animalSobCustodia(animal('em_quarentena'))).toBe(true)
  })

  it('exclui adotado, óbito e transferido', () => {
    expect(animalSobCustodia(animal('adotado'))).toBe(false)
    expect(animalSobCustodia(animal('obito_natural'))).toBe(false)
    expect(animalSobCustodia(animal('obito_eutanasia'))).toBe(false)
    expect(animalSobCustodia(animal('transferido'))).toBe(false)
  })
})
