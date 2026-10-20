import { describe, expect, it } from 'vitest'
import { atualizarAnimal, buscarAnimalPorId, criarAnimal } from '@/features/animais/api/animaisApi'
import { criarVacinacao } from '@/features/animais/api/historicoApi'
import type { AnimalRequest } from '@/features/animais/types/animais.types'
import { hojeEmItu } from '@/lib/datas'

// O mock precisa seguir a regra do backend (FichaCompletaService, DER §3.2):
// microchip com texto e ao menos uma vacinação vigente. Antes ele gravava
// fichaCompleta = "tem microchip", a regra anterior à V18.

const ANIMAL: AnimalRequest = {
  nome: 'Teste Ficha',
  especie: 'canino',
  sexo: 'macho',
  esterilizado: false,
  status: 'em_tratamento',
  motivoEntrada: 'resgate',
  dataEntrada: `${hojeEmItu()}T09:00:00`,
}

function vacinar(animalId: string) {
  return criarVacinacao({
    animalId,
    vacina: 'v10',
    dataAplicacao: hojeEmItu(),
    doseQuantidade: 1,
    doseUnidade: 'MILILITRO',
  })
}

describe('fichaCompleta no mock', () => {
  it('microchip sem vacinação: incompleta; a primeira vacinação completa', async () => {
    const animal = await criarAnimal({ ...ANIMAL, microchip: '111222333' })
    expect(animal.fichaCompleta).toBe(false)

    await vacinar(animal.id)

    expect((await buscarAnimalPorId(animal.id)).fichaCompleta).toBe(true)
  })

  it('vacinação sem microchip: incompleta; definir o microchip depois completa', async () => {
    const animal = await criarAnimal(ANIMAL)
    await vacinar(animal.id)
    expect((await buscarAnimalPorId(animal.id)).fichaCompleta).toBe(false)

    const atualizado = await atualizarAnimal(animal.id, { ...ANIMAL, microchip: '444555666' })

    expect(atualizado.fichaCompleta).toBe(true)
  })

  it('microchip só com espaços não conta', async () => {
    const animal = await criarAnimal({ ...ANIMAL, microchip: '   ' })
    await vacinar(animal.id)
    expect((await buscarAnimalPorId(animal.id)).fichaCompleta).toBe(false)
  })
})
