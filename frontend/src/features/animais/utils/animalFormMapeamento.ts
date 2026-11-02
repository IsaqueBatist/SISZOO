import { hojeEmItu } from '@/lib/datas'
import {
  animalCastrado,
  CONDICAO_OUTRAS,
  castracaoParaEsterilizado,
  esterilizadoParaCastracao,
  STATUS_OBITO_EUTANASIA,
  STATUS_TRANSFERIDO,
  type AnimalFormUiValues,
  type CastracaoOpcao,
} from '../schemas/animalFormSchema'
import type {
  Animal,
  AnimalRequest,
  EutanasiaRequest,
  Pelagem,
  Porte,
  Sexo,
  TipoDestinoTransferencia,
  TransferenciaRequest,
} from '../types/animais.types'

export interface RascunhoAnimalValores {
  nome: string
  especie: string
  sexo: Sexo | ''
  raca: string
  coloracao: string
  pelagem: Pelagem | ''
  porte: Porte | ''
  pesoKg: string
  idadeAprox: string
  dataNascimentoAprox: string
  microchip: string
  castracaoOpcao: CastracaoOpcao
  numeroMedalha?: string
  dataImplantacaoChip?: string
  procedencia?: string
  laudoEutanasia?: string
  tipoDestinoTransferencia?: TipoDestinoTransferencia | ''
  destinoTransferencia?: string
  dataSaida?: string
  documentoTransferencia?: string
  metodoEutanasia?: string
  insensibilizacaoPrevia?: boolean
  dataEsterilizacao: string
  status: string
  motivoEntrada: string
  dataEntrada: string
  baiaId: string
  fotoArquivoId?: string
  observacoes: string
  condicoes?: string[]
  condicoesOutras?: string
}

export type ValoresIniciaisAnimal = Omit<RascunhoAnimalValores, 'fotoArquivoId'> & { fotoUrl: string }

export function valoresVazios(): ValoresIniciaisAnimal {
  return {
    nome: '',
    especie: '',
    sexo: '',
    raca: '',
    coloracao: '',
    pelagem: '',
    porte: '',
    pesoKg: '',
    idadeAprox: '',
    dataNascimentoAprox: '',
    microchip: '',
    numeroMedalha: '',
    dataImplantacaoChip: '',
    procedencia: '',
    laudoEutanasia: '',
    tipoDestinoTransferencia: '',
    destinoTransferencia: '',
    dataSaida: '',
    documentoTransferencia: '',
    metodoEutanasia: '',
    insensibilizacaoPrevia: false,
    castracaoOpcao: 'nao_informado',
    dataEsterilizacao: '',
    status: '',
    motivoEntrada: '',
    dataEntrada: hojeEmItu(),
    baiaId: '',
    fotoUrl: '',
    observacoes: '',
  }
}

export function valoresDeAnimal(animal: Animal): ValoresIniciaisAnimal {
  return {
    nome: animal.nome,
    especie: animal.especieCodigo,
    sexo: animal.sexo,
    raca: animal.raca ?? '',
    coloracao: animal.coloracao ?? '',
    pelagem: animal.pelagem ?? '',
    porte: animal.porte ?? '',
    pesoKg: animal.pesoKg != null ? String(animal.pesoKg) : '',
    idadeAprox: animal.idadeAprox ?? '',
    dataNascimentoAprox: animal.dataNascimentoAprox ?? '',
    microchip: animal.microchip ?? '',
    numeroMedalha: animal.numeroMedalha ?? '',
    dataImplantacaoChip: animal.dataImplantacaoChip ?? '',
    procedencia: animal.procedencia ?? '',
    laudoEutanasia: animal.laudoEutanasia ?? '',
    tipoDestinoTransferencia: animal.tipoDestinoTransferencia ?? '',
    destinoTransferencia: animal.destinoTransferencia ?? '',
    dataSaida: animal.dataSaida?.slice(0, 16) ?? '',
    documentoTransferencia: animal.documentoTransferencia ?? '',
    metodoEutanasia: animal.laudoEutanasiaMetodo ?? '',
    insensibilizacaoPrevia: animal.laudoEutanasiaInsensibilizacaoPrevia ?? false,
    castracaoOpcao: esterilizadoParaCastracao(animal.esterilizado, animal.sexo),
    dataEsterilizacao: animal.dataEsterilizacao ?? '',
    status: animal.statusCodigo,
    motivoEntrada: animal.motivoEntradaCodigo,
    dataEntrada: animal.dataEntrada.slice(0, 10),
    baiaId: animal.baiaId ?? '',
    fotoUrl: animal.fotoUrl ?? '',
    observacoes: animal.observacoes ?? '',
    condicoes: animal.condicoes?.map((condicao) => condicao.codigo) ?? [],
    condicoesOutras: animal.condicoesOutras ?? '',
  }
}

export function valoresParaRascunho(valores: AnimalFormUiValues, fotoArquivoId: string | null): RascunhoAnimalValores {
  return {
    nome: valores.nome,
    especie: valores.especie,
    sexo: valores.sexo,
    raca: valores.raca ?? '',
    coloracao: valores.coloracao ?? '',
    pelagem: valores.pelagem ?? '',
    porte: valores.porte ?? '',
    pesoKg: valores.pesoKg != null ? String(valores.pesoKg) : '',
    idadeAprox: valores.idadeAprox ?? '',
    dataNascimentoAprox: valores.dataNascimentoAprox ?? '',
    microchip: valores.microchip ?? '',
    numeroMedalha: valores.numeroMedalha ?? '',
    dataImplantacaoChip: valores.dataImplantacaoChip ?? '',
    procedencia: valores.procedencia ?? '',
    laudoEutanasia: valores.laudoEutanasia ?? '',
    tipoDestinoTransferencia: valores.tipoDestinoTransferencia ?? '',
    destinoTransferencia: valores.destinoTransferencia ?? '',
    dataSaida: valores.dataSaida ?? '',
    documentoTransferencia: valores.documentoTransferencia ?? '',
    metodoEutanasia: valores.metodoEutanasia ?? '',
    insensibilizacaoPrevia: valores.insensibilizacaoPrevia ?? false,
    castracaoOpcao: valores.castracaoOpcao,
    dataEsterilizacao: valores.dataEsterilizacao ?? '',
    status: valores.status,
    motivoEntrada: valores.motivoEntrada,
    dataEntrada: valores.dataEntrada,
    baiaId: valores.baiaId ?? '',
    fotoArquivoId: fotoArquivoId ?? undefined,
    observacoes: valores.observacoes ?? '',
    condicoes: valores.condicoes,
    condicoesOutras: valores.condicoesOutras ?? '',
  }
}

export function rascunhoParaValores(rascunho: RascunhoAnimalValores, fotoUrlAtual: string | undefined): AnimalFormUiValues {
  return {
    nome: rascunho.nome,
    especie: rascunho.especie,
    sexo: rascunho.sexo as AnimalFormUiValues['sexo'],
    raca: rascunho.raca || undefined,
    coloracao: rascunho.coloracao || undefined,
    pelagem: (rascunho.pelagem || undefined) as AnimalFormUiValues['pelagem'],
    porte: (rascunho.porte || undefined) as AnimalFormUiValues['porte'],
    pesoKg: rascunho.pesoKg.trim() ? Number(rascunho.pesoKg) : undefined,
    idadeAprox: rascunho.idadeAprox || undefined,
    dataNascimentoAprox: rascunho.dataNascimentoAprox || undefined,
    microchip: rascunho.microchip || undefined,
    numeroMedalha: rascunho.numeroMedalha || undefined,
    dataImplantacaoChip: rascunho.dataImplantacaoChip || undefined,
    procedencia: rascunho.procedencia || undefined,
    laudoEutanasia: rascunho.laudoEutanasia || undefined,
    tipoDestinoTransferencia: rascunho.tipoDestinoTransferencia || undefined,
    destinoTransferencia: rascunho.destinoTransferencia || undefined,
    dataSaida: rascunho.dataSaida || undefined,
    documentoTransferencia: rascunho.documentoTransferencia || undefined,
    metodoEutanasia: rascunho.metodoEutanasia || undefined,
    insensibilizacaoPrevia: rascunho.insensibilizacaoPrevia ?? false,
    castracaoOpcao: rascunho.castracaoOpcao,
    dataEsterilizacao: rascunho.dataEsterilizacao || undefined,
    status: rascunho.status,
    motivoEntrada: rascunho.motivoEntrada,
    dataEntrada: rascunho.dataEntrada,
    baiaId: rascunho.baiaId || undefined,
    fotoUrl: fotoUrlAtual || undefined,
    observacoes: rascunho.observacoes || undefined,
    condicoes: rascunho.condicoes ?? [],
    condicoesOutras: rascunho.condicoesOutras || undefined,
  }
}

function dataEntradaParaEnvio(dataDoForm: string, original?: string): string {
  if (original && original.slice(0, 10) === dataDoForm) return original
  return `${dataDoForm}T00:00:00`
}

type RegistroOriginal = Pick<Animal, 'dataSaida' | 'documentoTransferencia' | 'laudoEutanasia'>

function transferenciaParaEnvio(
  dados: AnimalFormUiValues,
  original?: RegistroOriginal,
): TransferenciaRequest | undefined {
  if (original?.dataSaida) {
    const documento = dados.documentoTransferencia?.trim()
    return !original.documentoTransferencia && documento ? { documento } : undefined
  }
  if (dados.status !== STATUS_TRANSFERIDO) return undefined
  return {
    tipoDestino: dados.tipoDestinoTransferencia,
    destino: dados.destinoTransferencia,
    dataSaida: dados.dataSaida ? `${dados.dataSaida.slice(0, 16)}:00` : undefined,
    documento: dados.documentoTransferencia || undefined,
  }
}

function eutanasiaParaEnvio(dados: AnimalFormUiValues, original?: RegistroOriginal): EutanasiaRequest | undefined {
  if (original?.laudoEutanasia || dados.status !== STATUS_OBITO_EUTANASIA) return undefined
  return {
    metodo: dados.metodoEutanasia || undefined,
    insensibilizacaoPrevia: dados.insensibilizacaoPrevia === true,
  }
}

export function paraAnimalRequest(
  dados: AnimalFormUiValues,
  dataEntradaOriginal?: string,
  registroOriginal?: RegistroOriginal,
): AnimalRequest {
  return {
    nome: dados.nome,
    especie: dados.especie,
    sexo: dados.sexo,
    raca: dados.raca,
    coloracao: dados.coloracao,
    pelagem: dados.pelagem,
    porte: dados.porte,
    pesoKg: dados.pesoKg,
    idadeAprox: dados.idadeAprox,
    dataNascimentoAprox: dados.dataNascimentoAprox,
    microchip: dados.microchip,
    numeroMedalha: dados.numeroMedalha,
    dataImplantacaoChip: dados.dataImplantacaoChip,
    procedencia: dados.procedencia,
    laudoEutanasia: dados.laudoEutanasia,
    esterilizado: castracaoParaEsterilizado(dados.castracaoOpcao),
    dataEsterilizacao: animalCastrado(dados.castracaoOpcao) ? dados.dataEsterilizacao : undefined,
    status: dados.status,
    motivoEntrada: dados.motivoEntrada,
    dataEntrada: dataEntradaParaEnvio(dados.dataEntrada, dataEntradaOriginal),
    baiaId: dados.baiaId,
    fotoUrl: dados.fotoUrl,
    observacoes: dados.observacoes,
    condicoes: dados.condicoes,
    condicoesOutras: dados.condicoes.includes(CONDICAO_OUTRAS) ? dados.condicoesOutras : undefined,
    transferencia: transferenciaParaEnvio(dados, registroOriginal),
    eutanasia: eutanasiaParaEnvio(dados, registroOriginal),
  }
}

export const semVazio = (v: unknown) => (typeof v === 'string' ? v || undefined : v)
export const paraNumeroOuIndefinido = (v: unknown) => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : undefined
  if (typeof v === 'string') return v.trim() ? Number(v) : undefined
  return undefined
}
