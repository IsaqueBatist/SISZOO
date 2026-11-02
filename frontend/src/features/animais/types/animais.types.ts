export type Sexo = 'macho' | 'femea' | 'nao_identificado'
export type Pelagem = 'curta' | 'longa'
export type Porte = 'pequeno' | 'medio' | 'grande'

export interface Animal {
  id: string
  nome: string
  especieCodigo: string
  especieNome: string
  sexo: Sexo
  raca: string | null
  coloracao: string | null
  pelagem: Pelagem | null
  porte: Porte | null
  pesoKg: number | null
  idadeAprox: string | null
  dataNascimentoAprox: string | null
  microchip: string | null
  esterilizado: boolean | null
  dataEsterilizacao: string | null
  statusCodigo: string
  statusNome: string
  motivoEntradaCodigo: string
  motivoEntradaNome: string
  dataEntrada: string
  baiaId: string | null
  baiaNome: string | null
  tipoBaiaNome: string | null
  fichaCompleta: boolean
  fotoUrl: string | null
  observacoes: string | null
  condicoes?: CatalogoItem[] | null
  condicoesOutras?: string | null
  criadoPorId: string
  criadoPorNome: string
  criadoEm: string
  atualizadoEm: string
  numeroMedalha?: string | null
  dataImplantacaoChip?: string | null
  procedencia?: string | null
  laudoEutanasia?: string | null
}

export interface CatalogoItem {
  codigo: string
  nome: string
}

export interface VacinaCatalogo extends CatalogoItem {
  intervaloMeses: number | null
}

export interface CatalogosAnimal {
  especies: CatalogoItem[]
  status: CatalogoItem[]
  motivosEntrada: CatalogoItem[]
  tiposBaia: CatalogoItem[]
  tiposExame?: CatalogoItem[]
  laboratorios?: CatalogoItem[]
  vacinas: VacinaCatalogo[]
  tiposProcedimento: CatalogoItem[]
  condicoesSaude: CatalogoItem[]
}

export interface AnexoAnimal {
  id: string
  animalId: string
  nome: string
  mimeType: string
  tamanho: number
  descricao: string | null
  criadoPorId: string | null
  criadoPorNome: string | null
  criadoEm: string
}

export interface Baia {
  id: string
  nome: string
  tipoBaiaCodigo: string
  tipoBaiaNome: string
  capacidade: number
  finalidade: string | null
  ativa: boolean
  observacoes: string | null
  ocupacaoAtual: number
  superlotada: boolean
}

export interface BaiaRequest {
  nome: string
  tipoBaia: string
  capacidade: number
  finalidade?: string
  observacoes?: string
}

export interface AnimaisFiltro {
  status?: string
  custodia?: boolean
  especie?: string
  baiaId?: string
  q?: string
  pagina: number
  tamanho: number
}

export interface AnimalRequest {
  nome: string
  especie: string
  sexo: Sexo
  raca?: string
  coloracao?: string
  pelagem?: Pelagem
  porte?: Porte
  pesoKg?: number
  idadeAprox?: string
  dataNascimentoAprox?: string
  microchip?: string
  esterilizado: boolean | null
  dataEsterilizacao?: string
  status: string
  motivoEntrada: string
  dataEntrada: string
  baiaId?: string
  fotoUrl?: string
  observacoes?: string
  condicoes?: string[]
  condicoesOutras?: string
  numeroMedalha?: string
  dataImplantacaoChip?: string
  procedencia?: string
  laudoEutanasia?: string
}

export interface ResidenteBaia {
  baiaId: string
  id: string
  nome: string
  fotoUrl: string | null
}
