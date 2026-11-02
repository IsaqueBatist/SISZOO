export interface Vacina {
  id: string
  codigo: string
  nome: string
  intervaloMeses: number | null
  ativo: boolean
}

export interface CriarVacinaRequest {
  nome: string
  intervaloMeses?: number
}

export interface AtualizarVacinaRequest {
  nome: string
  intervaloMeses?: number
  ativo: boolean
}
