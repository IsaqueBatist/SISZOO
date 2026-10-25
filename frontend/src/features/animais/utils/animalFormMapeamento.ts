import { hojeEmItu } from '@/lib/datas'
import {
  castracaoParaEsterilizado,
  esterilizadoParaCastracao,
  type AnimalFormUiValues,
  type CastracaoOpcao,
} from '../schemas/animalFormSchema'
import type { Animal, AnimalRequest, Pelagem, Porte, Sexo } from '../types/animais.types'

// Conversões do formulário de animal (AnimalForm): valores iniciais, rascunho
// em IndexedDB e o payload do POST/PUT.

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
  // F2-004 / F2-008: opcionais no rascunho (rascunhos antigos não os têm)
  numeroMedalha?: string
  dataImplantacaoChip?: string
  procedencia?: string
  laudoEutanasia?: string
  dataEsterilizacao: string
  status: string
  motivoEntrada: string
  dataEntrada: string
  baiaId: string
  // T42: a foto NÃO vai mais aqui como data URI. O rascunho guarda só o id do
  // arquivo na store 'arquivos', onde a imagem comprimida fica como Blob.
  // Rascunhos gravados antes da T42 ainda têm `fotoUrl` preenchido; ele é
  // ignorado na restauração (ver rascunhoParaValores).
  fotoArquivoId?: string
  observacoes: string
}

// Valores iniciais do formulário. Diferem do rascunho só na foto: aqui ela é o
// data URI que a API devolve e recebe (`fotoUrl`, String no DTO); no rascunho é
// o id do arquivo guardado como Blob.
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
    castracaoOpcao: 'nao_castrado',
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
    castracaoOpcao: esterilizadoParaCastracao(animal.esterilizado, animal.sexo),
    dataEsterilizacao: animal.dataEsterilizacao ?? '',
    status: animal.statusCodigo,
    motivoEntrada: animal.motivoEntradaCodigo,
    dataEntrada: animal.dataEntrada.slice(0, 10),
    baiaId: animal.baiaId ?? '',
    fotoUrl: animal.fotoUrl ?? '',
    observacoes: animal.observacoes ?? '',
  }
}

// Converte o valor do formulário (RHF, com número/undefined) para o formato
// persistido em IndexedDB (RascunhoAnimalValores, todo em string). A foto entra
// como id do arquivo na store 'arquivos' — nunca o data URI (T42).
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
    castracaoOpcao: valores.castracaoOpcao,
    dataEsterilizacao: valores.dataEsterilizacao ?? '',
    status: valores.status,
    motivoEntrada: valores.motivoEntrada,
    dataEntrada: valores.dataEntrada,
    baiaId: valores.baiaId ?? '',
    fotoArquivoId: fotoArquivoId ?? undefined,
    observacoes: valores.observacoes ?? '',
  }
}

// Inverso: um rascunho carregado do IndexedDB (todo string) vira valores do
// formulário RHF. Aceita também um rascunho salvo antes da T42 — o `fotoUrl`
// que ele traz é ignorado, porque a foto do rascunho agora vem da store de
// arquivos, de forma assíncrona. `fotoUrlAtual` preserva o que já está na
// tela, que na edição é a foto do próprio animal. Também converte os valores
// iniciais da edição (ValoresIniciaisAnimal tem o mesmo formato).
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
    castracaoOpcao: rascunho.castracaoOpcao,
    dataEsterilizacao: rascunho.dataEsterilizacao || undefined,
    status: rascunho.status,
    motivoEntrada: rascunho.motivoEntrada,
    dataEntrada: rascunho.dataEntrada,
    baiaId: rascunho.baiaId || undefined,
    fotoUrl: fotoUrlAtual || undefined,
    observacoes: rascunho.observacoes || undefined,
  }
}

// dataEntrada é LocalDateTime: o formulário só edita o dia. Se o dia não
// mudou na edição, reenvia o valor original completo para não zerar a hora;
// dia novo (ou cadastro) vai como meia-noite, como antes.
function dataEntradaParaEnvio(dataDoForm: string, original?: string): string {
  if (original && original.slice(0, 10) === dataDoForm) return original
  return `${dataDoForm}T00:00:00`
}

// Payload do POST/PUT. `dataEntradaOriginal`: a do animal em edição.
export function paraAnimalRequest(dados: AnimalFormUiValues, dataEntradaOriginal?: string): AnimalRequest {
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
    // Rascunho antigo pode trazer data com "não castrado": não envia.
    dataEsterilizacao: dados.castracaoOpcao === 'nao_castrado' ? undefined : dados.dataEsterilizacao,
    status: dados.status,
    motivoEntrada: dados.motivoEntrada,
    dataEntrada: dataEntradaParaEnvio(dados.dataEntrada, dataEntradaOriginal),
    baiaId: dados.baiaId,
    fotoUrl: dados.fotoUrl,
    observacoes: dados.observacoes,
  }
}

// setValueAs dos campos: roda tanto sobre o valor digitado (string, do DOM)
// quanto sobre o valor inicial vindo de defaultValues/reset/setValue
// diretamente — que pode já chegar como number/undefined, não só string.
export const semEspacos = (v: unknown) => (typeof v === 'string' ? v.trim() || undefined : v)
export const semVazio = (v: unknown) => (typeof v === 'string' ? v || undefined : v)
export const paraNumeroOuIndefinido = (v: unknown) => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : undefined
  if (typeof v === 'string') return v.trim() ? Number(v) : undefined
  return undefined
}
