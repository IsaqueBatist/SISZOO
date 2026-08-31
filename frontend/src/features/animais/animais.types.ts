export type Sexo = 'macho' | 'femea' | 'nao_identificado'
export type Pelagem = 'curta' | 'longa'
export type Porte = 'pequeno' | 'medio' | 'grande'

// Espelha com.siszoo.animais.dto.AnimalResponse do backend.
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
  esterilizado: boolean
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
  criadoPorId: string
  criadoPorNome: string
  criadoEm: string
  atualizadoEm: string
}

export interface CatalogoItem {
  codigo: string
  nome: string
}

// Espelha com.siszoo.animais.dto.CatalogosAnimalResponse.
export interface CatalogosAnimal {
  especies: CatalogoItem[]
  status: CatalogoItem[]
  motivosEntrada: CatalogoItem[]
  tiposBaia: CatalogoItem[]
}

export interface AnimaisFiltro {
  status?: string
  especie?: string
  q?: string
  pagina: number
  tamanho: number
}
