import { describe, expect, it } from 'vitest'
import { castracaoParaEsterilizado, esterilizadoParaCastracao } from '../schemas/animalFormSchema'
import type { Animal } from '../types/animais.types'
import {
  paraAnimalRequest,
  rascunhoParaValores,
  valoresDeAnimal,
  valoresParaRascunho,
  valoresVazios,
} from './animalFormMapeamento'

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

describe('condições de saúde', () => {
  it('leva os códigos da ficha, e o texto de "outras" só quando ela está marcada', () => {
    const original = animal({
      condicoes: [
        { codigo: 'epilepsia', nome: 'Epilepsia' },
        { codigo: 'outras', nome: 'Outras' },
      ],
      condicoesOutras: 'Displasia',
    })
    const valores = rascunhoParaValores(valoresDeAnimal(original), '')

    expect(paraAnimalRequest(valores, original.dataEntrada)).toMatchObject({
      condicoes: ['epilepsia', 'outras'],
      condicoesOutras: 'Displasia',
    })
    expect(paraAnimalRequest({ ...valores, condicoes: ['epilepsia'] }, original.dataEntrada).condicoesOutras).toBeUndefined()
  })

  it('rascunho anterior ao campo restaura sem condições, sem quebrar', () => {
    const { condicoes: _condicoes, condicoesOutras: _outras, ...rascunhoAntigo } = valoresDeAnimal(animal())

    expect(rascunhoParaValores(rascunhoAntigo, '').condicoes).toEqual([])
  })
})

describe('castração sem resposta', () => {
  it('"não informado" vai como null e volta como "não informado", sem virar "não castrado"', () => {
    expect(castracaoParaEsterilizado('nao_informado')).toBeNull()
    expect(esterilizadoParaCastracao(null, 'macho')).toBe('nao_informado')
    expect(castracaoParaEsterilizado('nao_castrado')).toBe(false)
    expect(esterilizadoParaCastracao(false, 'macho')).toBe('nao_castrado')
  })
})

describe('edição: GET -> formulário -> PUT', () => {
  it('nenhum campo se perde nem muda de valor no caminho', () => {
    const original = animal()
    const valores = rascunhoParaValores(valoresDeAnimal(original), valoresDeAnimal(original).fotoUrl)

    expect(paraAnimalRequest(valores, original.dataEntrada)).toEqual({
      condicoes: [],
      condicoesOutras: undefined,
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

  it('transferido manda o destino com a data de saída em segundos', () => {
    const valores = {
      ...rascunhoParaValores(valoresVazios(), undefined),
      status: 'transferido',
      tipoDestinoTransferencia: 'OUTRO_CCZ' as const,
      destinoTransferencia: 'CCZ de Sorocaba',
      dataSaida: '2026-03-12T09:30',
    }

    expect(paraAnimalRequest(valores).transferencia).toEqual({
      tipoDestino: 'OUTRO_CCZ',
      destino: 'CCZ de Sorocaba',
      dataSaida: '2026-03-12T09:30:00',
      documento: undefined,
    })
    expect(paraAnimalRequest({ ...valores, status: 'em_tratamento' }).transferencia).toBeUndefined()
  })

  it('transferência já registrada não é reenviada; só o documento que ficou em branco', () => {
    const original = animal({
      statusCodigo: 'transferido',
      tipoDestinoTransferencia: 'ORGAO_PUBLICO',
      destinoTransferencia: 'Prefeitura de Salto',
      dataSaida: '2026-03-12T09:30:45',
      documentoTransferencia: null,
    })
    const valores = rascunhoParaValores(valoresDeAnimal(original), undefined)

    expect(paraAnimalRequest(valores, original.dataEntrada, original).transferencia).toBeUndefined()
    expect(
      paraAnimalRequest({ ...valores, documentoTransferencia: 'Ofício 7/2026' }, original.dataEntrada, original)
        .transferencia,
    ).toEqual({ documento: 'Ofício 7/2026' })
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

describe('eutanásia', () => {
  it('manda método e insensibilização ao registrar; desmarcada vai como false', () => {
    const valores = {
      ...rascunhoParaValores(valoresVazios(), undefined),
      status: 'obito_eutanasia',
      laudoEutanasia: 'Quadro irreversível',
      metodoEutanasia: 'Barbitúrico intravenoso',
      insensibilizacaoPrevia: true,
    }

    expect(paraAnimalRequest(valores).eutanasia).toEqual({
      metodo: 'Barbitúrico intravenoso',
      insensibilizacaoPrevia: true,
    })
    expect(paraAnimalRequest({ ...valores, insensibilizacaoPrevia: false }).eutanasia?.insensibilizacaoPrevia).toBe(false)
    expect(paraAnimalRequest({ ...valores, status: 'em_tratamento' }).eutanasia).toBeUndefined()
  })

  it('laudo já registrado não reenvia método nem insensibilização', () => {
    const original = animal({ statusCodigo: 'obito_eutanasia', laudoEutanasia: 'Laudo gravado' })
    const valores = rascunhoParaValores(valoresDeAnimal(original), undefined)

    const corpo = paraAnimalRequest(valores, original.dataEntrada, original)

    expect(corpo.eutanasia).toBeUndefined()
    expect(corpo.laudoEutanasia).toBe('Laudo gravado')
  })
})
