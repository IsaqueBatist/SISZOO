// Contrato da API de processos sanitários (T29, com.siszoo.processos.dto).
// Catálogos (doença, laboratório, sintoma, espécie) vão e voltam pelo
// `codigo`; enums da amostra em maiúsculas (D38). Sexo e pelagem usam o
// domínio de `animal`, em minúsculas (DH-9).

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

// GET /api/processos/catalogos
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

// Campos clínicos, nas duas modalidades de amostra.
interface AmostraClinicaRequest {
  statusClinico: StatusClinicoAmostra
  tipoAbrigo: TipoAbrigo
  alteracaoComportamental?: string
  dataColeta: string
  materialBiologico: MaterialBiologico
  contatoHumano: boolean
  nivelContato?: NivelContato // obrigatório se, e somente se, houve contato
  agrediuHumano?: boolean // idem
  observacoes?: string
  sintomas: string[] // só em amostra SINTOMATICO
}

// Animal do canil: só o animalId; a identificação vem da ficha no servidor
// (snapshot, DH-5) e não pode ser enviada.
export type AmostraCanilRequest = AmostraClinicaRequest & { animalId: string }

// Animal de campo: espécie e sexo obrigatórios.
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

// POST /api/processos — processo completo numa requisição. `urgente` não é
// enviado: o servidor deriva das amostras (regra 18).
export interface CriarProcessoRequest {
  dataAbertura: string
  doenca: string
  laboratorio: string
  ocorrenciaId: string | null
  responsavel: ResponsavelProcessoRequest
  amostras: AmostraAnimalRequest[]
  observacoes?: string
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

// A identificação é a gravada na amostra (snapshot), nunca a ficha atual.
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
  contatoHumano: boolean
  nivelContato: NivelContato | null
  agrediuHumano: boolean | null
  observacoes: string | null
  sintomas: CatalogoItem[]
}

// GET /api/processos/{id} (ProcessoSanitarioResponse). resultadoLaboratorial/
// dataResultado/desfechoAnimal (T37) são nulos até o lançamento do
// resultado; depois de lançados, são write-once (trigger da V14).
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
  resultadoLaboratorial: CatalogoItem | null
  dataResultado: string | null
  desfechoAnimal: CatalogoItem | null
  criadoEm: string
}

// POST /api/processos/{id}/resultado (T37). resultadoLaboratorial/
// desfechoAnimal são códigos do catálogo (resultadosLaboratoriais/desfechos
// de CatalogosProcesso) — "aguardando" não é um valor aceito aqui.
export interface RegistrarResultadoRequest {
  resultadoLaboratorial: string
  desfechoAnimal?: string
}

// GET /api/processos/{id}/historico (T37): mini trilha de auditoria do
// processo (HistoricoProcessoItemResponse) — sem payload nem dado pessoal.
export interface HistoricoProcessoItem {
  id: string
  usuarioEmail: string | null
  acao: string
  ocorreuEm: string
}

// Linha de GET /api/processos (ProcessoResumoResponse)
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
  status?: StatusProcesso
  pagina: number
  tamanho: number
}

// Decisão da etapa 1 do wizard: "" = nenhuma decisão ainda. Não é campo da
// API — o vínculo em si é o `ocorrenciaId` opcional.
export type VinculoDecisao = 'vinculado' | 'sem_vinculo' | ''
