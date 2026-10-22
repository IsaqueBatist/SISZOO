import type {
  PreviewAdocoes,
  PreviewAnualProcessos,
  PreviewOcorrenciasBairro,
  PreviewOcupacaoBaias,
  PreviewProcedimentos,
  PreviewVacinacao,
  RelatorioGeradoItem,
  TipoRelatorioInfo,
} from '@/features/relatorios/types/relatorios.types'

// Os 6 tipos do catalogo (DER §3.6) — nomes e filtros espelham
// com.siszoo.relatorios.entity.TipoRelatorio.
export const TIPOS_RELATORIO_FIXTURE: TipoRelatorioInfo[] = [
  { codigo: 'anual_processos', nome: 'Relatório Anual de Processos', filtro: 'ano' },
  { codigo: 'vacinacao', nome: 'Relatório de Vacinação', filtro: 'periodo' },
  { codigo: 'adocoes', nome: 'Relatório de Adoções', filtro: 'periodo' },
  { codigo: 'procedimentos', nome: 'Relatório de Procedimentos', filtro: 'periodo' },
  { codigo: 'ocupacao_baias', nome: 'Ocupação de Baias', filtro: 'janela' },
  { codigo: 'ocorrencias_bairro', nome: 'Ocorrências por Bairro', filtro: 'periodo' },
]

export function previewOcupacaoBaiasFixture(): PreviewOcupacaoBaias {
  return {
    periodoInicio: '2026-03-10',
    periodoFim: '2026-09-10',
    kpis: { ocupacaoMediaPercentual: 72, baiasSuperlotadas: 1, baiasNoLimite: 1, capacidadeTotal: 18 },
    baias: [
      { baia: 'Baia 1', capacidade: 6, atual: 5, percentualOcupacao: 83, status: 'normal' },
      { baia: 'Baia 6', capacidade: 6, atual: 6, percentualOcupacao: 100, status: 'proximo_limite' },
      { baia: 'Baia 3', capacidade: 6, atual: 8, percentualOcupacao: 133, status: 'superlotada' },
    ],
  }
}

export function previewVacinacaoFixture(): PreviewVacinacao {
  return {
    periodoInicio: '2026-01-01',
    periodoFim: '2026-09-10',
    kpis: {
      vacinasAplicadas: 487,
      percentualAnimaisVacinados: 84,
      animaisVacinados: 123,
      totalSobCustodia: 147,
      vencidas: 12,
      aVencerEm30Dias: 28,
    },
    porVacina: [
      { vacina: 'Antirrábica', aplicacoes: 142, coberturaAtualPercentual: 96, vencendoEm30Dias: 8 },
      { vacina: 'V10', aplicacoes: 128, coberturaAtualPercentual: 89, vencendoEm30Dias: 12 },
    ],
    porVeterinario: [
      { veterinario: 'Dra. Stéphanie Lima', aplicacoes: 185 },
      { veterinario: 'Dr. Rafael Souza', aplicacoes: 136 },
    ],
    animaisVencidos: [
      { animal: 'Pingo', microchip: '985121235103881', baia: 'Baia 4', vacina: 'Antirrábica', diasAtraso: 42 },
      { animal: 'Pipoca', microchip: null, baia: 'Baia 4', vacina: 'V10', diasAtraso: 28 },
    ],
    animaisVencidosExcedente: 8,
  }
}

export function previewProcedimentosFixture(): PreviewProcedimentos {
  return {
    periodoInicio: '2026-04-01',
    periodoFim: '2026-04-30',
    kpis: { totalProcedimentos: 318, castracoes: 34, castracoesMachos: 21, castracoesFemeas: 13, atendimentosClinicos: 87, cirurgiasMaiores: 12 },
    porTipo: [
      { tipo: 'Vacinação', quantidade: 159 },
      { tipo: 'Atendimento clínico', quantidade: 87 },
      { tipo: 'Castração', quantidade: 34 },
      { tipo: 'Medicações', quantidade: 26 },
      { tipo: 'Cirurgia maior', quantidade: 12 },
    ],
    porVeterinario: [
      { veterinario: 'Stéphanie Lima', atendimentos: 28, castracoes: 11, cirurgias: 4, vacinacoes: 62, total: 105 },
      { veterinario: 'Rafael Souza', atendimentos: 24, castracoes: 9, cirurgias: 3, vacinacoes: 48, total: 84 },
    ],
    totalVeterinarios: { veterinario: 'TOTAL', atendimentos: 52, castracoes: 20, cirurgias: 7, vacinacoes: 110, total: 189 },
    cirurgias: [
      { data: '2026-04-28', animal: 'Thor', procedimento: 'OSH', veterinario: 'Rafael Souza', resultado: 'Sem intercorr.' },
    ],
    cirurgiasExcedente: 0,
  }
}

export function previewOcorrenciasBairroFixture(): PreviewOcorrenciasBairro {
  return {
    periodoInicio: '2026-01-01',
    periodoFim: '2026-05-20',
    kpis: { ocorrenciasRegistradas: 218, bairrosAtingidos: 21, tempoMedioHoras: 3.4, encerradas: 207, percentualEncerradas: 95 },
    bairros: [
      { bairro: 'Centro', ocorrencias: 42, tipoPredominante: 'Infestação de Morcegos', tempoMedioHoras: 2.8 },
      { bairro: 'Outros (12 bairros)', ocorrencias: 46, tipoPredominante: 'Diversos', tempoMedioHoras: 3.5 },
    ],
    tipos: [
      { tipo: 'Infestação de Morcegos', quantidade: 68 },
      { tipo: 'Animal Agressivo', quantidade: 51 },
    ],
    notaFocoGeografico: 'O bairro Centro concentra 19,3% das ocorrências, principalmente relacionadas à Infestação de Morcegos.',
  }
}

export function previewAdocoesFixture(): PreviewAdocoes {
  return {
    periodoInicio: '2026-01-01',
    periodoFim: '2026-03-31',
    kpis: { animaisAdotados: 24 },
    perfil: [
      { caracteristica: 'Canino', quantidade: 17, percentual: 71 },
      { caracteristica: 'Felino', quantidade: 7, percentual: 29 },
      { caracteristica: 'Porte Pequeno', quantidade: 11, percentual: 46 },
    ],
    notaLimitacao:
      'Este relatório mostra a quantidade ATUAL de animais com status "Adotado" — não é filtrado pelo período selecionado.',
  }
}

export function previewAnualProcessosFixture(): PreviewAnualProcessos {
  return {
    ano: 2025,
    periodoInicio: '2025-01-01',
    periodoFim: '2025-12-31',
    kpis: { processosAbertos: 87, confirmadosPositivos: 14, percentualPositividade: 16, comContatoHumano: 9, tempoMedioDias: 11 },
    sumarioExecutivo: 'Durante o exercício de 2025, o CCZ instaurou 87 processo(s) sanitário(s)...',
    porPatologia: [{ doenca: 'Raiva', quantidade: 28 }],
    resultadosPorDoenca: [
      { doenca: 'Raiva', investigados: 28, positivos: 2, negativos: 24, inconclusivos: 1, aguardando: 1, percentualPositividade: 7 },
    ],
    totalResultados: { doenca: 'TOTAL', investigados: 87, positivos: 14, negativos: 69, inconclusivos: 3, aguardando: 1, percentualPositividade: 16 },
    porEspecie: [{ especie: 'Canino', quantidade: 52, percentual: 60 }],
    bairros: [{ bairro: 'Centro', processos: 14, positivos: 3, doencasPredominantes: 'Esporotricose · Leptospirose' }],
    laboratorios: [{ laboratorio: 'Instituto Pasteur — SP', amostras: 31, percentualDoTotal: 36, tempoMedioDias: 8 }],
  }
}

export function historicoRelatoriosFixture(): RelatorioGeradoItem[] {
  return [
    {
      docId: 'DOC-2026-0001',
      tipo: 'vacinacao',
      tipoNomeExibicao: 'Relatório de Vacinação',
      periodoInicio: '2026-01-01',
      periodoFim: '2026-09-10',
      geradoPorNome: 'Stéphanie Lima',
      geradoEm: '2026-09-10T15:00:00-03:00',
      tamanhoBytes: 420_000,
      parametrosJson: JSON.stringify({ tipo: 'vacinacao', periodoInicio: '2026-01-01', periodoFim: '2026-09-10' }),
    },
  ]
}
