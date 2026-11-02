export type TipoRelatorioCodigo =
  | 'anual_processos'
  | 'vacinacao'
  | 'adocoes'
  | 'procedimentos'
  | 'ocupacao_baias'
  | 'ocorrencias_bairro'

export type FiltroEsperado = 'ano' | 'posicao' | 'periodo'

export interface TipoRelatorioInfo {
  codigo: TipoRelatorioCodigo
  nome: string
  filtro: FiltroEsperado
}

export interface FiltroRelatorio {
  tipo: TipoRelatorioCodigo
  periodoInicio?: string
  periodoFim?: string
  ano?: number
}

export type StatusOcupacaoBaia = 'normal' | 'proximo_limite' | 'superlotada'

export interface LinhaOcupacaoBaia {
  baia: string
  capacidade: number
  atual: number
  percentualOcupacao: number
  status: StatusOcupacaoBaia
  rotuloStatus: string
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

export interface KpisProcedimentos {
  totalProcedimentos: number
  castracoes: number
  castracoesMachos: number
  castracoesFemeas: number
  atendimentosClinicos: number
  cirurgiasMaiores: number
}

export interface ProcedimentoPorTipo {
  tipo: string
  quantidade: number
}

export interface ProdutividadeVeterinario {
  veterinario: string
  atendimentos: number
  castracoes: number
  cirurgias: number
  vacinacoes: number
  total: number
}

export interface CirurgiaRealizada {
  data: string
  animal: string
  procedimento: string
  veterinario: string
  resultado: string
}

export interface PreviewProcedimentos {
  periodoInicio: string
  periodoFim: string
  kpis: KpisProcedimentos
  porTipo: ProcedimentoPorTipo[]
  porVeterinario: ProdutividadeVeterinario[]
  totalVeterinarios: ProdutividadeVeterinario
  cirurgias: CirurgiaRealizada[]
  cirurgiasExcedente: number
}

export interface LinhaBairroOcorrencia {
  bairro: string
  ocorrencias: number
  tipoPredominante: string
  tempoMedioHoras: number | null
}

export interface TipoOcorrenciaContagem {
  tipo: string
  quantidade: number
}

export interface KpisOcorrenciasBairro {
  ocorrenciasRegistradas: number
  bairrosAtingidos: number
  tempoMedioHoras: number | null
  encerradas: number
  percentualEncerradas: number
}

export interface PreviewOcorrenciasBairro {
  periodoInicio: string
  periodoFim: string
  kpis: KpisOcorrenciasBairro
  bairros: LinhaBairroOcorrencia[]
  tipos: TipoOcorrenciaContagem[]
  notaFocoGeografico: string
}

export interface PerfilAdocao {
  caracteristica: string
  quantidade: number
  percentual: number
}

export interface KpisAdocoes {
  animaisAdotados: number
}

export interface PreviewAdocoes {
  periodoInicio: string
  periodoFim: string
  kpis: KpisAdocoes
  perfil: PerfilAdocao[]
  notaLimitacao: string
}

export interface KpisAnualProcessos {
  processosAbertos: number
  confirmadosPositivos: number
  percentualPositividade: number
  comContatoHumano: number
  contatoNaoInformado: number
  tempoMedioDias: number | null
}

export interface CasoPorPatologia {
  doenca: string
  quantidade: number
}

export interface ResultadoLaboratorialPorDoenca {
  doenca: string
  investigados: number
  positivos: number
  negativos: number
  inconclusivos: number
  aguardando: number
  percentualPositividade: number
}

export interface DistribuicaoEspecie {
  especie: string
  quantidade: number
  percentual: number
}

export interface BairroProcesso {
  bairro: string
  processos: number
  positivos: number
  doencasPredominantes: string
}

export interface LaboratorioUtilizado {
  laboratorio: string
  amostras: number
  percentualDoTotal: number
  tempoMedioDias: number | null
}

export interface PreviewAnualProcessos {
  ano: number
  periodoInicio: string
  periodoFim: string
  kpis: KpisAnualProcessos
  sumarioExecutivo: string
  porPatologia: CasoPorPatologia[]
  resultadosPorDoenca: ResultadoLaboratorialPorDoenca[]
  totalResultados: ResultadoLaboratorialPorDoenca
  porEspecie: DistribuicaoEspecie[]
  bairros: BairroProcesso[] | null
  laboratorios: LaboratorioUtilizado[]
}

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
