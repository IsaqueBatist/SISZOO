// Contrato PROPOSTO para GET /api/dashboard/graficos — endpoint ainda não
// existe (com.siszoo.relatorios é um esqueleto vazio). Ver
// docs/contratos/dashboard-graficos.md.
//
// NÃO inclui ocupação por baia: esse dado já é real hoje via GET /baias
// (features/animais) — ver GraficoOcupacaoBaia.tsx, que usa useBaiasQuery()
// direto, sem mock.

export interface CatalogoItem {
  codigo: string
  nome: string
}

// Donut "Casos por Doença" — SEMPRE as 6 doenças do catálogo de processos
// (raiva, esporotricose, leishmaniose_visceral, leptospirose,
// febre_maculosa, febre_amarela), inclusive com quantidade: 0.
export interface CasosPorDoenca {
  doenca: CatalogoItem
  quantidade: number
}

// Donut "Raiva por Espécie" — só processos com doenca=raiva, por espécie da
// amostra (canino, felino, quiroptero, pnh — 4 itens do catálogo).
export interface CasosRaivaPorEspecie {
  especie: CatalogoItem
  quantidade: number
}

// Barras "Resultados Laboratoriais" — LISTA DINÂMICA: só entram doenças que
// tiveram ao menos 1 resultado positivo ou negativo lançado (replica
// docs/prototipo/dashboard.html, que mostra só 3 das 6 doenças). Diferente
// do donut acima, que é fixo nas 6.
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
