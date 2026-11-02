export interface CatalogoItem {
  codigo: string
  nome: string
}

export interface CasosPorDoenca {
  doenca: CatalogoItem
  quantidade: number
}

export interface CasosRaivaPorEspecie {
  especie: CatalogoItem
  quantidade: number
}

export interface ResultadoLaboratorialPorDoenca {
  doenca: CatalogoItem
  positivos: number
  negativos: number
}

export interface DashboardGraficos {
  casosPorDoenca: CasosPorDoenca[]
  casosRaivaPorEspecie: CasosRaivaPorEspecie[]
  resultadosPorDoenca: ResultadoLaboratorialPorDoenca[]
}
