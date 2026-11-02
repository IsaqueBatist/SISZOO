import type { DashboardGraficos } from '../types/graficos.types'

const LATENCIA_MOCK_MS = 300

const GRAFICOS_MOCK: DashboardGraficos = {
  casosPorDoenca: [
    { doenca: { codigo: 'raiva', nome: 'Raiva' }, quantidade: 7 },
    { doenca: { codigo: 'leishmaniose_visceral', nome: 'Leishmaniose Visceral' }, quantidade: 5 },
    { doenca: { codigo: 'leptospirose', nome: 'Leptospirose' }, quantidade: 4 },
    { doenca: { codigo: 'esporotricose', nome: 'Esporotricose' }, quantidade: 3 },
    { doenca: { codigo: 'febre_maculosa', nome: 'Febre Maculosa' }, quantidade: 1 },
    { doenca: { codigo: 'febre_amarela', nome: 'Febre Amarela' }, quantidade: 0 },
  ],
  casosRaivaPorEspecie: [
    { especie: { codigo: 'canino', nome: 'Canino' }, quantidade: 10 },
    { especie: { codigo: 'felino', nome: 'Felino' }, quantidade: 5 },
    { especie: { codigo: 'pnh', nome: 'PNH' }, quantidade: 3 },
    { especie: { codigo: 'quiroptero', nome: 'Quiróptero' }, quantidade: 2 },
  ],
  resultadosPorDoenca: [
    { doenca: { codigo: 'leishmaniose_visceral', nome: 'Leishmaniose Visceral' }, positivos: 0, negativos: 3 },
    { doenca: { codigo: 'esporotricose', nome: 'Esporotricose' }, positivos: 2, negativos: 3 },
    { doenca: { codigo: 'raiva', nome: 'Raiva' }, positivos: 0, negativos: 2 },
  ],
}

export function getGraficosMock(): Promise<DashboardGraficos> {
  return new Promise((resolve) => setTimeout(() => resolve(GRAFICOS_MOCK), LATENCIA_MOCK_MS))
}
