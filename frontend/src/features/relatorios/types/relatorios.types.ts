// Espelha com.siszoo.relatorios.entity.TipoRelatorio / dto do backend (T41).
// Os 6 codigos vem do catalogo do DER §3.6 — nao inventar outro aqui.
export type TipoRelatorioCodigo =
  | 'anual_processos'
  | 'vacinacao'
  | 'adocoes'
  | 'procedimentos'
  | 'ocupacao_baias'
  | 'ocorrencias_bairro'

export type FiltroEsperado = 'ano' | 'janela' | 'periodo'

export interface TipoRelatorioInfo {
  codigo: TipoRelatorioCodigo
  nome: string
  filtro: FiltroEsperado
}

export type JanelaOcupacao = 'ultimos_6_meses' | 'ultimos_12_meses' | 'custom'

// Filtro bruto enviado para /preview e /exportar — cada tipo usa um
// subconjunto (periodoInicio/Fim, OU ano, OU janela), resolvido no backend
// (FiltroRelatorioResolver) para um periodo sempre concreto.
export interface FiltroRelatorio {
  tipo: TipoRelatorioCodigo
  periodoInicio?: string
  periodoFim?: string
  ano?: number
  janela?: JanelaOcupacao
}

export type StatusOcupacaoBaia = 'normal' | 'proximo_limite' | 'superlotada'

export interface LinhaOcupacaoBaia {
  baia: string
  capacidade: number
  atual: number
  percentualOcupacao: number
  status: StatusOcupacaoBaia
}

export interface KpisOcupacaoBaias {
  ocupacaoMediaPercentual: number
  baiasSuperlotadas: number
  baiasNoLimite: number
  capacidadeTotal: number
}

export interface PreviewOcupacaoBaias {
  periodoInicio: string
  periodoFim: string
  kpis: KpisOcupacaoBaias
  baias: LinhaOcupacaoBaia[]
}

export interface AplicacaoPorVacina {
  vacina: string
  aplicacoes: number
  coberturaAtualPercentual: number
  vencendoEm30Dias: number
}

export interface AplicacaoPorVeterinario {
  veterinario: string
  aplicacoes: number
}

export interface AnimalVacinaVencida {
  animal: string
  microchip: string | null
  baia: string | null
  vacina: string
  diasAtraso: number
}

export interface KpisVacinacao {
  vacinasAplicadas: number
  percentualAnimaisVacinados: number
  animaisVacinados: number
  totalSobCustodia: number
  vencidas: number
  aVencerEm30Dias: number
}

export interface PreviewVacinacao {
  periodoInicio: string
  periodoFim: string
  kpis: KpisVacinacao
  porVacina: AplicacaoPorVacina[]
  porVeterinario: AplicacaoPorVeterinario[]
  animaisVencidos: AnimalVacinaVencida[]
  animaisVencidosExcedente: number
}

// GET /api/relatorios/historico — sem arquivoUrl: o arquivo nao e persistido
// nesta versao. A acao da linha e "Gerar novamente", nao "Baixar".
// parametrosJson e o filtro bruto original (string JSON), necessario porque
// periodoInicio/periodoFim aqui ja vem resolvidos (ver RelatorioGeradoResponse no backend).
export interface RelatorioGeradoItem {
  docId: string
  tipo: TipoRelatorioCodigo
  tipoNomeExibicao: string
  periodoInicio: string
  periodoFim: string
  geradoPorNome: string
  geradoEm: string
  tamanhoBytes: number | null
  parametrosJson: string | null
}
