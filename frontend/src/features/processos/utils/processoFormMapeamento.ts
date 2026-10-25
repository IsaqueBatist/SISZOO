import { hojeEmItu } from '@/lib/datas'
import type { ProcessoFormValues } from '../schemas/processoFormSchema'
import type { AmostraAnimalRequest, CriarProcessoRequest } from '../types/processos.types'

// Conversões do formulário de processo sanitário (ProcessoForm): valores
// iniciais e o payload do POST.

// Os `'' as never` são o placeholder dos selects ainda sem escolha: o schema
// recusa o vazio na validação da etapa.
export function amostraVazia(): ProcessoFormValues['amostras'][number] {
  return {
    origem: 'canil',
    animalId: '',
    animalDescricao: '',
    statusClinico: '' as never,
    tipoAbrigo: '' as never,
    alteracaoComportamental: '',
    dataColeta: hojeEmItu(),
    materialBiologico: '' as never,
    contatoHumano: false,
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

// Payload de POST /api/processos. Whitelist por modalidade: a amostra do
// canil leva só o animalId (o servidor copia a identificação da ficha e
// recusa com 422 se ela vier junto, DH-5); a de campo leva a identificação.
// Nível de contato e agressão só com contato; sintomas só em SINTOMATICO.
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
