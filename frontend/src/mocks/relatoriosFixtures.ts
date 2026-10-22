import type {
  PreviewOcupacaoBaias,
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
