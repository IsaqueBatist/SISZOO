import type { CasosPorDoenca, CasosRaivaPorEspecie, ResultadoLaboratorialPorDoenca } from '../types/graficos.types'
import { corDoenca } from './coresDoenca'
import { corEspecie } from './coresEspecie'

export interface DonutDatum {
  codigo: string
  nome: string
  quantidade: number
  cor: string
}

// Mantém as 6 doenças mesmo com quantidade 0 (ex. febre_amarela sem caso no
// período) — o donut mostra a fatia zerada, não omite a categoria.
export function mapearCasosPorDoenca(dados: CasosPorDoenca[]): DonutDatum[] {
  return dados.map((item) => ({
    codigo: item.doenca.codigo,
    nome: item.doenca.nome,
    quantidade: item.quantidade,
    cor: corDoenca(item.doenca.codigo),
  }))
}

export function mapearRaivaPorEspecie(dados: CasosRaivaPorEspecie[]): DonutDatum[] {
  return dados.map((item) => ({
    codigo: item.especie.codigo,
    nome: item.especie.nome,
    quantidade: item.quantidade,
    cor: corEspecie(item.especie.codigo),
  }))
}

export interface BarraResultadoDatum {
  codigo: string
  doencaNome: string
  positivos: number
  negativos: number
  totalExames: number
}

// Lista dinâmica: só entram as doenças que a API devolver (as que tiveram
// exame) — diferente do donut de "casos por doença", que é fixo nas 6.
export function mapearResultadosLaboratoriais(dados: ResultadoLaboratorialPorDoenca[]): BarraResultadoDatum[] {
  return dados.map((item) => ({
    codigo: item.doenca.codigo,
    doencaNome: item.doenca.nome,
    positivos: item.positivos,
    negativos: item.negativos,
    totalExames: item.positivos + item.negativos,
  }))
}
