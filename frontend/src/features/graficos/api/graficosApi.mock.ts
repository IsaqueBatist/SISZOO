import type { DashboardGraficos } from '../types/graficos.types'

// Mesma latência simulada de features/dashboard/api/dashboardApi.mock.ts.
const LATENCIA_MOCK_MS = 300

// Números do protótipo (docs/prototipo/dashboard.html, script inline):
// donut "Por Patologia" soma 20 (Raiva 7, Leishmaniose 5, Leptospirose 4,
// Esporotricose 3, Febre Maculosa 1) — febre_amarela entra com 0 (ausente no
// protótipo, decisão validada: mostrar as 6 do catálogo mesmo assim).
// Donut "Raiva por Espécie" soma 20 (Canino 10, Felino 5, PNH 3,
// Quiróptero 2). "Resultados Laboratoriais" só tem 3 doenças com exame.
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
