// PROVISÓRIO: não existe com.siszoo.processos.dto.ProcessoResponse no
// backend ainda (módulo `processos` só tem pastas .gitkeep). Tipos modelados
// a partir de docs/DER.md §3.5 (Processo Sanitário) até o contrato real
// existir; revalidar campo a campo quando o backend nascer.

export type Doenca = 'raiva' | 'esporotricose' | 'leishmaniose_visceral' | 'leptospirose' | 'febre_maculosa' | 'febre_amarela'

export type Laboratorio = 'pasteur_sp' | 'ial_sorocaba' | 'ccz_sp' | 'itu_ll01'

export type StatusProcesso = 'aberto' | 'aguardando_resultado' | 'com_resultado' | 'concluido'

export type StatusClinicoAmostra = 'sintomatico' | 'assintomatico' | 'obito'

export type TipoAbrigo = 'intradomiciliar' | 'peridomiciliar' | 'silvestre' | 'nao_identificado'

export type MaterialBiologico = 'tecido_encefalico' | 'soro' | 'sangue' | 'saliva' | 'urina'

export type NivelContato = 'direta' | 'indireta'

// PROVISÓRIO / [EXTRAPOLAÇÃO]: DER.md §3.5 modela resultado laboratorial e documentos como
// parte de processo_sanitario/documento_processo, mas o contrato do T32 não os incluía
// (backend ainda não existe). Campos adicionados na T33 para o detalhe somente-leitura;
// revalidar contra o DTO real quando o backend nascer.
export type ResultadoLaboratorial =
  | 'aguardando'
  | 'positivo'
  | 'negativo'
  | 'inconclusivo'
  | 'material_inadequado'
  | 'nao_realizado'

export type DesfechoAnimal = 'em_acompanhamento' | 'obito_natural' | 'obito_eutanasia' | 'obito_outro'

export type TipoDocumentoProcesso = 'ficha_investigacao' | 'termo_envio' | 'foto_coleta' | 'outro'

export type Sintoma =
  | 'apatia'
  | 'alt_comportamental'
  | 'descamacao'
  | 'ulcera_pele'
  | 'ceratoconjuntivite'
  | 'coriza'
  | 'emagrecimento'
  | 'diarreia'
  | 'salivacao_excessiva'
  | 'hemorragia_interna'
  | 'vomito'
  | 'aumento_linfonodo'

// Resumo somente-leitura da ocorrência vinculada (etapa 1 / revisão). Campos
// pessoais do denunciante já vêm mascarados pelo mock/backend quando
// `sigilosa = true` e o perfil não é Admin — igual a
// ocorrencias.types.ts::Denunciante.
export interface OcorrenciaParaVinculo {
  id: string
  protocolo: string
  tipoOcorrencia: string
  bairro: string
  statusOcorrencia: string
  sigilosa: boolean
  denunciante: { nome: string | null } | null
}

export interface ProcessoResponsavel {
  nome: string
  cpf?: string
  telefone?: string
  email?: string
  cep?: string
  endereco?: string
  bairroResidencial?: string
  bairroOcorrencia?: string
}

// PROVISÓRIO / [EXTRAPOLAÇÃO] — ver comentário de ResultadoLaboratorial acima.
export interface DocumentoProcesso {
  id: string
  nome: string
  url: string
  tipo: TipoDocumentoProcesso
  tamanho: number
  mimeType: string
  criadoEm: string
  criadoPorNome: string
}

// Campos de identificação do animal_amostrado (DER.md:559-580) — no modo
// canil vêm como snapshot somente-leitura copiado do Animal selecionado; no
// modo externo são digitados. Em ambos os casos são campos reais do DER.
interface AmostraAnimalIdentificacao {
  sexo: 'macho' | 'femea' | 'nao_identificado'
  raca?: string
  coloracao?: string
  pelagem?: string
  idadeAprox?: string
  pesoKg?: number
}

// [EXTRAPOLAÇÃO] união discriminada — "origem" não é campo do DER, é só o
// discriminante de UI/Zod para decidir a origem dos dados de identificação;
// nunca é enviado misturado com os dados do modo abandonado.
export type AmostraAnimalOrigem =
  | ({ origem: 'canil'; animalId: string; especieId: string } & AmostraAnimalIdentificacao)
  | ({ origem: 'externo'; especieId: string } & AmostraAnimalIdentificacao)

export type AmostraAnimal = AmostraAnimalOrigem & {
  statusClinico: StatusClinicoAmostra
  tipoAbrigo: TipoAbrigo
  alteracaoComportamental?: string
  dataColeta: string
  materialBiologico: MaterialBiologico
  contatoHumano: boolean
  nivelContato?: NivelContato // obrigatório quando contatoHumano
  agrediuHumano?: boolean // obrigatório quando contatoHumano
  observacoes?: string
  sintomas: Sintoma[]
}

// [EXTRAPOLAÇÃO] campo de UI para gatear a etapa 1 (DER trata o vínculo como
// FK 0..1 opcional, sem campo de "decisão" — o RHF precisa de um valor
// tri-state para bloquear "nenhuma escolha feita ainda", igual selecionar
// ocorrência ou clicar "Pular esta etapa").
export type VinculoDecisao = 'vinculado' | 'sem_vinculo' | ''

export interface CriarProcessoRequest {
  dataAbertura: string
  doenca: Doenca
  laboratorio: Laboratorio
  ocorrenciaId: string | null // fixado na etapa 1 (RN2); null = decisão "sem_vinculo"
  responsavel: ProcessoResponsavel
  amostras: AmostraAnimal[] // mínimo 1, DER.md:584
  observacoes?: string
}

export interface Processo {
  id: string
  protocolo: string
  dataAbertura: string
  doenca: Doenca
  laboratorio: Laboratorio
  ocorrenciaVinculado: OcorrenciaParaVinculo | null
  statusProcesso: StatusProcesso
  urgente: boolean
  responsavel: ProcessoResponsavel
  amostras: AmostraAnimal[]
  observacoes?: string
  criadoPorNome: string
  criadoEm: string
  atualizadoEm: string
  // PROVISÓRIO / [EXTRAPOLAÇÃO] — ver comentário de ResultadoLaboratorial acima.
  galNumero?: string
  sinanNumero?: string
  cid?: string
  dataEnvioAmostras?: string
  previsaoRetorno?: string
  resultadoLaboratorial?: ResultadoLaboratorial
  dataResultado?: string
  desfechoAnimal?: DesfechoAnimal
  documentos: DocumentoProcesso[]
}

export interface ProcessosFiltro {
  doenca?: Doenca
  statusProcesso?: StatusProcesso
  pagina: number
  tamanho: number
}
