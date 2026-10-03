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

// Espelha com.siszoo.animais.dto.BaiaResponse.
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

// Espelha com.siszoo.animais.dto.CriarBaiaRequest / AtualizarBaiaRequest do
// backend (os dois DTOs têm campos idênticos).
export interface BaiaRequest {
  nome: string
  tipoBaia: string
  capacidade: number
  finalidade?: string
  observacoes?: string
}

export interface AnimaisFiltro {
  status?: string
  especie?: string
  baiaId?: string
  q?: string
  pagina: number
  tamanho: number
}

// Espelha com.siszoo.animais.dto.CriarAnimalRequest / AtualizarAnimalRequest
// do backend (os dois DTOs têm campos idênticos). Ao contrário de `Animal`
// (resposta), aqui espécie/status/motivo de entrada vão como código puro
// (`especie`, `status`, `motivoEntrada`), sem o sufixo `Codigo` nem os `*Nome`
// — nunca reenviar `especieNome`/`statusNome`/`motivoEntradaNome`.
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
  esterilizado: boolean
  dataEsterilizacao?: string
  status: string
  motivoEntrada: string
  dataEntrada: string
  baiaId?: string
  fotoUrl?: string
  observacoes?: string
}
