import { describe, expect, it } from 'vitest'
import type { Animal } from '../types/animais.types'
import {
  paraAnimalRequest,
  rascunhoParaValores,
  valoresDeAnimal,
  valoresParaRascunho,
  valoresVazios,
} from './animalFormMapeamento'

// Formato do GET /animais/{id} (AnimalResponse via Jackson).
function animal(sobrescrever: Partial<Animal> = {}): Animal {
  return {
    id: 'b2c3d4e5-0000-0000-0000-0000000000a1',
    nome: 'Pipoca',
    especieCodigo: 'canino',
    especieNome: 'Canino',
    sexo: 'femea',
    raca: null,
    coloracao: 'Caramelo',
    pelagem: null,
    porte: 'medio',
    pesoKg: 12.5,
    idadeAprox: null,
    dataNascimentoAprox: '2024-01-15',
    microchip: '985121234567891',
    esterilizado: true,
    dataEsterilizacao: '2025-02-01',
    statusCodigo: 'disponivel_adocao',
    statusNome: 'Disponível para adoção',
    motivoEntradaCodigo: 'resgate',
    motivoEntradaNome: 'Resgate',
    dataEntrada: '2026-03-10T14:30:00',
    baiaId: null,
    baiaNome: null,
    tipoBaiaNome: null,
    fichaCompleta: false,
    fotoUrl: null,
    observacoes: null,
    criadoPorId: 'a1b2c3d4-0000-0000-0000-000000000001',
    criadoPorNome: 'Stéphanie Lima',
    criadoEm: '2026-03-10T14:30:00',
    atualizadoEm: '2026-03-10T14:30:00',
    numeroMedalha: 'M-0042',
    dataImplantacaoChip: '2026-03-11',
    procedencia: 'Bairro Brasil',
    laudoEutanasia: null,
    ...sobrescrever,
  }
}

describe('edição: GET -> formulário -> PUT', () => {
  it('nenhum campo se perde nem muda de valor no caminho', () => {
    const original = animal()
    const valores = rascunhoParaValores(valoresDeAnimal(original), valoresDeAnimal(original).fotoUrl)

    expect(paraAnimalRequest(valores, original.dataEntrada)).toEqual({
      nome: 'Pipoca',
      especie: 'canino',
      sexo: 'femea',
      raca: undefined,
      coloracao: 'Caramelo',
      pelagem: undefined,
      porte: 'medio',
      pesoKg: 12.5,
      idadeAprox: undefined,
      dataNascimentoAprox: '2024-01-15',
      microchip: '985121234567891',
      numeroMedalha: 'M-0042',
      dataImplantacaoChip: '2026-03-11',
      procedencia: 'Bairro Brasil',
      laudoEutanasia: undefined,
      esterilizado: true,
      dataEsterilizacao: '2025-02-01',
      status: 'disponivel_adocao',
      motivoEntrada: 'resgate',
      // Dia não mudou: a hora original volta inteira.
      dataEntrada: '2026-03-10T14:30:00',
      baiaId: undefined,
      fotoUrl: undefined,
      observacoes: undefined,
    })
  })

  it('dia de entrada alterado vai como meia-noite', () => {
    const original = animal()
    const valores = { ...rascunhoParaValores(valoresDeAnimal(original), undefined), dataEntrada: '2026-03-12' }

    expect(paraAnimalRequest(valores, original.dataEntrada).dataEntrada).toBe('2026-03-12T00:00:00')
  })
})

describe('paraAnimalRequest', () => {
  it('"não castrado" nunca manda data de castração (rascunho antigo pode trazer)', () => {
    const valores = {
      ...rascunhoParaValores(valoresVazios(), undefined),
      castracaoOpcao: 'nao_castrado' as const,
      dataEsterilizacao: '2025-02-01',
    }

    const corpo = paraAnimalRequest(valores)

    expect(corpo.esterilizado).toBe(false)
    expect(corpo.dataEsterilizacao).toBeUndefined()
  })
})

describe('rascunho', () => {
  it('ida e volta preserva os valores; a foto fica fora do rascunho (só o id)', () => {
    const valores = rascunhoParaValores(valoresDeAnimal(animal({ fotoUrl: 'data:image/jpeg;base64,AAAA' })), 'data:image/jpeg;base64,AAAA')
    const salvo = valoresParaRascunho(valores, 'arquivo-1')

    expect(salvo.fotoArquivoId).toBe('arquivo-1')
    expect(salvo).not.toHaveProperty('fotoUrl')
    expect(rascunhoParaValores(salvo, valores.fotoUrl)).toEqual(valores)
  })

  it('rascunho anterior à F2-004/F2-008 (sem os campos novos) restaura com eles vazios', () => {
    const { numeroMedalha, dataImplantacaoChip, procedencia, laudoEutanasia, ...antigo } = valoresParaRascunho(
      rascunhoParaValores(valoresVazios(), undefined),
      null,
    )
    void [numeroMedalha, dataImplantacaoChip, procedencia, laudoEutanasia]

    const restaurado = rascunhoParaValores(antigo, undefined)

    expect(restaurado.numeroMedalha).toBeUndefined()
    expect(restaurado.procedencia).toBeUndefined()
  })
})
