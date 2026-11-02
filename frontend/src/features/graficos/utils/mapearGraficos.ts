import type { CasosPorDoenca, CasosRaivaPorEspecie, ResultadoLaboratorialPorDoenca } from '../types/graficos.types'
import { corDoenca } from './coresDoenca'
import { corEspecie } from './coresEspecie'

export interface DonutDatum {
  codigo: string
  nome: string
  quantidade: number
  cor: string
}

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

export function mapearResultadosLaboratoriais(dados: ResultadoLaboratorialPorDoenca[]): BarraResultadoDatum[] {
  return dados.map((item) => ({
    codigo: item.doenca.codigo,
    doencaNome: item.doenca.nome,
    positivos: item.positivos,
    negativos: item.negativos,
    totalExames: item.positivos + item.negativos,
  }))
}
