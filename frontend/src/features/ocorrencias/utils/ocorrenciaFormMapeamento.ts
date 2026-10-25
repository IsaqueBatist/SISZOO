import { hojeEmItu } from '@/lib/datas'
import type { OcorrenciaFormValues } from '../schemas/ocorrenciaFormSchema'
import type {
  AtualizarOcorrenciaRequest,
  CriarOcorrenciaRequest,
  DenunciadoRequest,
  DenuncianteRequest,
  Ocorrencia,
} from '../types/ocorrencias.types'
import { formatarHora } from './datas'

// Conversões do formulário de ocorrência (OcorrenciaForm): valores iniciais e
// payloads de POST e PUT.

export const DENUNCIANTE_VAZIO = { nome: '', cpf: '', telefone: '', email: '', cep: '', endereco: '', bairroResidencial: '' }

export function valoresVazios(): OcorrenciaFormValues {
  return {
    tipoOcorrencia: 'zoonose',
    dataAbertura: hojeEmItu(),
    horaAbertura: '',
    endereco: '',
    bairro: '',
    pontoReferencia: '',
    descricao: '',
    urgente: false,
    sigilosa: false,
    anonima: false,
    denunciante: { ...DENUNCIANTE_VAZIO },
    denunciadoAtivo: false,
    denunciado: { nome: '', cpf: '', telefone: '', endereco: '', observacoes: '' },
    anexos: [],
  }
}

// Edição: valores iniciais a partir da ocorrência devolvida pelo backend.
// Denunciante mascarado (sigilosa sem permissão) entra vazio e não é editável
// nem enviado — os null da máscara apagariam os dados reais (D10).
export function valoresDaOcorrencia(ocorrencia: Ocorrencia, mascarado: boolean): OcorrenciaFormValues {
  const denunciante = ocorrencia.denunciante
  const denunciado = ocorrencia.denunciado
  return {
    tipoOcorrencia: ocorrencia.tipoOcorrencia,
    dataAbertura: ocorrencia.dataAbertura,
    horaAbertura: ocorrencia.horaAbertura ? formatarHora(ocorrencia.horaAbertura) : '',
    endereco: ocorrencia.endereco,
    bairro: ocorrencia.bairro,
    pontoReferencia: ocorrencia.pontoReferencia ?? '',
    descricao: ocorrencia.descricao,
    urgente: ocorrencia.urgente,
    sigilosa: ocorrencia.sigilosa,
    anonima: ocorrencia.anonima,
    denunciante:
      mascarado || !denunciante
        ? { ...DENUNCIANTE_VAZIO }
        : {
            nome: denunciante.nome ?? '',
            cpf: denunciante.cpf ?? '',
            telefone: denunciante.telefone ?? '',
            email: denunciante.email ?? '',
            cep: denunciante.cep ?? '',
            endereco: denunciante.endereco ?? '',
            bairroResidencial: denunciante.bairroResidencial ?? '',
          },
    denunciadoAtivo: denunciado !== null,
    denunciado: {
      nome: denunciado?.nome ?? '',
      cpf: denunciado?.cpf ?? '',
      telefone: denunciado?.telefone ?? '',
      endereco: denunciado?.endereco ?? '',
      observacoes: denunciado?.observacoes ?? '',
    },
    anexos: [],
  }
}

// Monta o payload real a partir dos valores do form — strings vazias viram
// `undefined` (campo opcional ausente), nunca enviadas como "". Anexos não
// vão no JSON: cada arquivo é um POST multipart depois do cadastro (D15).
// Anônima nunca manda o bloco (D32); sigilosa sem nenhum dado também não.
function paraDenuncianteRequest(valores: OcorrenciaFormValues): DenuncianteRequest | undefined {
  if (valores.anonima) return undefined
  const bloco: DenuncianteRequest = {
    nome: valores.denunciante.nome || undefined,
    cpf: valores.denunciante.cpf || undefined,
    telefone: valores.denunciante.telefone || undefined,
    email: valores.denunciante.email || undefined,
    cep: valores.denunciante.cep || undefined,
    endereco: valores.denunciante.endereco || undefined,
    bairroResidencial: valores.denunciante.bairroResidencial || undefined,
  }
  return Object.values(bloco).some((valor) => valor !== undefined) ? bloco : undefined
}

function paraDenunciadoRequest(valores: OcorrenciaFormValues): DenunciadoRequest {
  return {
    nome: valores.denunciado.nome || undefined,
    cpf: valores.denunciado.cpf || undefined,
    telefone: valores.denunciado.telefone || undefined,
    endereco: valores.denunciado.endereco || undefined,
    observacoes: valores.denunciado.observacoes || undefined,
  }
}

export function paraRequisicao(valores: OcorrenciaFormValues): CriarOcorrenciaRequest {
  return {
    tipoOcorrencia: valores.tipoOcorrencia as CriarOcorrenciaRequest['tipoOcorrencia'],
    dataAbertura: valores.dataAbertura,
    horaAbertura: valores.horaAbertura || undefined,
    endereco: valores.endereco,
    bairro: valores.bairro,
    pontoReferencia: valores.pontoReferencia || undefined,
    descricao: valores.descricao,
    urgente: valores.urgente,
    sigilosa: valores.sigilosa,
    anonima: valores.anonima,
    denunciante: paraDenuncianteRequest(valores),
    denunciado: valores.denunciadoAtivo ? paraDenunciadoRequest(valores) : undefined,
  }
}

// PUT (D10): as flags vão sempre; cada bloco só quando o usuário mexeu nele
// (ausente = sem alteração; presente = substitui o bloco inteiro). Desligar
// "existe denunciado" manda o bloco vazio, que limpa os dados. Identificar
// uma anônima manda `anonima: false` junto com o bloco do denunciante.
export function paraAtualizacao(
  valores: OcorrenciaFormValues,
  original: Ocorrencia,
  alterados: { denunciante: boolean; denunciado: boolean },
  mascarado: boolean,
): AtualizarOcorrenciaRequest {
  const identificando = original.anonima && !valores.anonima
  const enviaDenunciante = !mascarado && !valores.anonima && (identificando || alterados.denunciante)
  return {
    ...paraRequisicao(valores),
    denunciante: enviaDenunciante ? (paraDenuncianteRequest(valores) ?? {}) : undefined,
    denunciado: alterados.denunciado ? (valores.denunciadoAtivo ? paraDenunciadoRequest(valores) : {}) : undefined,
  }
}
