import { hojeEmItu } from '@/lib/datas'
import type { ProcessoEdicaoValues } from '../schemas/processoEdicaoSchema'
import type { ProcessoFormValues } from '../schemas/processoFormSchema'
import type {
  AmostraAnimal,
  AmostraAnimalRequest,
  CriarProcessoRequest,
  EditarProcessoRequest,
  Processo,
} from '../types/processos.types'

export function amostraVazia(): ProcessoFormValues['amostras'][number] {
  return {
    origem: 'canil',
    animalId: '',
    animalDescricao: '',
    statusClinico: '' as never,
    tipoAbrigo: '' as never,
    alteracaoComportamental: '',
    dataColeta: '',
    materialBiologico: '' as never,
    contatoHumano: null,
    nivelContato: undefined,
    agrediuHumano: undefined,
    observacoes: '',
    sintomas: [],
  }
}

export function valoresVazios(): ProcessoFormValues {
  return {
    vinculoDecisao: '' as never,
    ocorrenciaId: null,
    ocorrenciaResumo: null,
    dataAbertura: hojeEmItu(),
    doenca: '',
    laboratorio: '',
    galNumero: '',
    sinanNumero: '',
    responsavel: {
      nome: '',
      cpf: '',
      telefone: '',
      email: '',
      cep: '',
      endereco: '',
      bairroResidencial: '',
      bairroOcorrencia: '',
    },
    amostras: [amostraVazia()],
    observacoes: '',
  }
}

function textoOuIndefinido(valor: string | undefined): string | undefined {
  const limpo = valor?.trim()
  return limpo ? limpo : undefined
}

function paraAmostraRequisicao(amostra: ProcessoFormValues['amostras'][number]): AmostraAnimalRequest {
  const clinico = {
    statusClinico: amostra.statusClinico,
    tipoAbrigo: amostra.tipoAbrigo,
    alteracaoComportamental: textoOuIndefinido(amostra.alteracaoComportamental),
    dataColeta: amostra.dataColeta,
    materialBiologico: amostra.materialBiologico,
    contatoHumano: amostra.contatoHumano,
    nivelContato: amostra.contatoHumano ? amostra.nivelContato : undefined,
    agrediuHumano: amostra.contatoHumano ? amostra.agrediuHumano : undefined,
    observacoes: textoOuIndefinido(amostra.observacoes),
    sintomas: amostra.statusClinico === 'SINTOMATICO' ? amostra.sintomas : [],
  }
  if (amostra.origem === 'canil') {
    return { animalId: amostra.animalId, ...clinico }
  }
  return {
    especie: amostra.especie,
    sexo: amostra.sexo,
    raca: textoOuIndefinido(amostra.raca),
    coloracao: textoOuIndefinido(amostra.coloracao),
    pelagem: amostra.pelagem || undefined,
    idadeAprox: textoOuIndefinido(amostra.idadeAprox),
    pesoKg: amostra.pesoKg,
    ...clinico,
  }
}

function amostraParaFormulario(amostra: AmostraAnimal): ProcessoFormValues['amostras'][number] {
  const clinico = {
    statusClinico: amostra.statusClinico,
    tipoAbrigo: amostra.tipoAbrigo,
    alteracaoComportamental: amostra.alteracaoComportamental ?? '',
    dataColeta: amostra.dataColeta,
    materialBiologico: amostra.materialBiologico,
    contatoHumano: amostra.contatoHumano,
    nivelContato: amostra.nivelContato ?? undefined,
    agrediuHumano: amostra.agrediuHumano ?? undefined,
    observacoes: amostra.observacoes ?? '',
    sintomas: amostra.sintomas.map((sintoma) => sintoma.codigo),
  }
  if (amostra.animalId) {
    const animalDescricao = [amostra.especie.nome, amostra.raca, amostra.coloracao].filter(Boolean).join(' · ')
    return { origem: 'canil', animalId: amostra.animalId, animalDescricao, ...clinico }
  }
  return {
    origem: 'externo',
    especie: amostra.especie.codigo,
    sexo: amostra.sexo,
    raca: amostra.raca ?? '',
    coloracao: amostra.coloracao ?? '',
    pelagem: amostra.pelagem ?? '',
    idadeAprox: amostra.idadeAprox ?? '',
    pesoKg: amostra.pesoKg ?? undefined,
    ...clinico,
  }
}

export function valoresDeProcesso(processo: Processo): ProcessoEdicaoValues {
  return {
    ...valoresVazios(),
    dataAbertura: processo.dataAbertura,
    doenca: processo.doenca.codigo,
    laboratorio: processo.laboratorio.codigo,
    galNumero: processo.galNumero ?? '',
    sinanNumero: processo.sinanNumero ?? '',
    observacoes: processo.observacoes ?? '',
    responsavel: {
      nome: processo.responsavel?.nome ?? '',
      cpf: processo.responsavel?.cpf ?? '',
      telefone: processo.responsavel?.telefone ?? '',
      email: processo.responsavel?.email ?? '',
      cep: processo.responsavel?.cep ?? '',
      endereco: processo.responsavel?.endereco ?? '',
      bairroResidencial: processo.responsavel?.bairroResidencial ?? '',
      bairroOcorrencia: processo.responsavel?.bairroOcorrencia ?? '',
    },
    amostras: processo.amostras.map(amostraParaFormulario),
    justificativa: '',
  }
}

export function paraEdicao(valores: ProcessoEdicaoValues, processo: Processo): EditarProcessoRequest {
  const { responsavel, amostras, observacoes, galNumero, sinanNumero } = paraRequisicao(valores)
  return {
    doenca: processo.resultado ? processo.doenca.codigo : valores.doenca,
    laboratorio: valores.laboratorio,
    galNumero,
    sinanNumero,
    observacoes,
    responsavel,
    amostras: amostras.map((dados, index) => ({ id: processo.amostras[index].id, dados })),
    justificativa: valores.justificativa.trim(),
  }
}

export function paraRequisicao(valores: ProcessoFormValues): CriarProcessoRequest {
  return {
    dataAbertura: valores.dataAbertura,
    doenca: valores.doenca,
    laboratorio: valores.laboratorio,
    galNumero: textoOuIndefinido(valores.galNumero),
    sinanNumero: textoOuIndefinido(valores.sinanNumero),
    ocorrenciaId: valores.vinculoDecisao === 'vinculado' ? valores.ocorrenciaId : null,
    responsavel: {
      nome: valores.responsavel.nome.trim(),
      cpf: textoOuIndefinido(valores.responsavel.cpf),
      telefone: textoOuIndefinido(valores.responsavel.telefone),
      email: textoOuIndefinido(valores.responsavel.email),
      cep: textoOuIndefinido(valores.responsavel.cep),
      endereco: textoOuIndefinido(valores.responsavel.endereco),
      bairroResidencial: textoOuIndefinido(valores.responsavel.bairroResidencial),
      bairroOcorrencia: textoOuIndefinido(valores.responsavel.bairroOcorrencia),
    },
    amostras: valores.amostras.map(paraAmostraRequisicao),
    observacoes: textoOuIndefinido(valores.observacoes),
  }
}
