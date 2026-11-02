import type { Pelagem, Sexo } from '@/features/animais/types/animais.types'

export type StatusProcesso = 'ABERTO' | 'AGUARDANDO_RESULTADO' | 'COM_RESULTADO' | 'CONCLUIDO'

export type StatusClinicoAmostra = 'SINTOMATICO' | 'ASSINTOMATICO' | 'OBITO'

export type TipoAbrigo = 'INTRADOMICILIAR' | 'PERIDOMICILIAR' | 'SILVESTRE' | 'NAO_IDENTIFICADO'

export type MaterialBiologico = 'TECIDO_ENCEFALICO' | 'SORO' | 'SANGUE' | 'SALIVA' | 'URINA'

export type NivelContato = 'DIRETA' | 'INDIRETA'

export interface CatalogoItem {
  codigo: string
  nome: string
}

export interface CatalogosProcesso {
  doencas: CatalogoItem[]
  laboratorios: CatalogoItem[]
  sintomas: CatalogoItem[]
  resultadosLaboratoriais: CatalogoItem[]
  desfechos: CatalogoItem[]
}

export interface ResponsavelProcessoRequest {
  nome: string
  cpf?: string
  telefone?: string
  email?: string
  cep?: string
  endereco?: string
  bairroResidencial?: string
  bairroOcorrencia?: string
}

interface AmostraClinicaRequest {
  statusClinico: StatusClinicoAmostra
  tipoAbrigo: TipoAbrigo
  alteracaoComportamental?: string
  dataColeta: string
  materialBiologico: MaterialBiologico
  contatoHumano: boolean | null
  nivelContato?: NivelContato
  agrediuHumano?: boolean
  observacoes?: string
  sintomas: string[]
}

export type AmostraCanilRequest = AmostraClinicaRequest & { animalId: string }

export type AmostraCampoRequest = AmostraClinicaRequest & {
  especie: string
  sexo: Sexo
  raca?: string
  coloracao?: string
  pelagem?: Pelagem
  idadeAprox?: string
  pesoKg?: number
}

export type AmostraAnimalRequest = AmostraCanilRequest | AmostraCampoRequest

export interface CriarProcessoRequest {
  dataAbertura: string
  doenca: string
  laboratorio: string
  ocorrenciaId: string | null
  responsavel: ResponsavelProcessoRequest
  amostras: AmostraAnimalRequest[]
  observacoes?: string
  galNumero?: string
  sinanNumero?: string
}

export interface ResponsavelProcesso {
  id: string
  nome: string
  cpf: string | null
  telefone: string | null
  email: string | null
  cep: string | null
  endereco: string | null
  bairroResidencial: string | null
  bairroOcorrencia: string | null
}

export interface AmostraAnimal {
  id: string
  animalId: string | null
  especie: CatalogoItem
  sexo: Sexo
  raca: string | null
  coloracao: string | null
  pelagem: Pelagem | null
  idadeAprox: string | null
  pesoKg: number | null
  statusClinico: StatusClinicoAmostra
  tipoAbrigo: TipoAbrigo
  alteracaoComportamental: string | null
  dataColeta: string
  materialBiologico: MaterialBiologico
  contatoHumano: boolean | null
  nivelContato: NivelContato | null
  agrediuHumano: boolean | null
  observacoes: string | null
  sintomas: CatalogoItem[]
}

export type AmostraEditada = { id: string; dados: AmostraAnimalRequest }

export interface EditarProcessoRequest {
  doenca: string
  laboratorio: string
  galNumero?: string
  sinanNumero?: string
  observacoes?: string
  responsavel: CriarProcessoRequest['responsavel']
  amostras: AmostraEditada[]
  justificativa: string
}

export interface ResultadoProcessoItem {
  id: string
  resultado: CatalogoItem
  dataResultado: string
  observacoes: string | null
  retificaId: string | null
  registradoPorId: string
  registradoPorNome: string
  registradoEm: string
}

export interface Processo {
  id: string
  protocolo: string
  dataAbertura: string
  ocorrenciaId: string | null
  ocorrenciaProtocolo: string | null
  urgente: boolean
  statusProcesso: StatusProcesso
  doenca: CatalogoItem
  cid: string | null
  laboratorio: CatalogoItem
  observacoes: string | null
  responsavel: ResponsavelProcesso | null
  amostras: AmostraAnimal[]
  criadoEm: string
  resultado: CatalogoItem | null
  dataResultado: string | null
  desfechoAnimal: CatalogoItem | null
  resultados: ResultadoProcessoItem[]
  dataNotificacaoMunicipe: string | null
  galNumero?: string | null
  sinanNumero?: string | null
}

export interface RegistrarResultadoRequest {
  resultado: string
  dataResultado: string
  observacoes?: string
  retificaId?: string
  desfechoAnimal?: string
}

export interface ProcessoResumo {
  id: string
  protocolo: string
  dataAbertura: string
  doenca: CatalogoItem
  statusProcesso: StatusProcesso
  urgente: boolean
  ocorrenciaId: string | null
  ocorrenciaProtocolo: string | null
}

export interface ProcessosFiltro {
  doenca?: string
  status?: StatusProcesso | StatusProcesso[]
  urgente?: boolean
  q?: string
  de?: string
  ate?: string
  pagina: number
  tamanho: number
}

export type VinculoDecisao = 'vinculado' | 'sem_vinculo' | ''
