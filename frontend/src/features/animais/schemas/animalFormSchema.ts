import { z } from 'zod'
import { naoEhFutura } from '@/lib/datas'

export const SEXO_OPCOES = [
  { valor: 'macho', label: 'Macho' },
  { valor: 'femea', label: 'Fêmea' },
  { valor: 'nao_identificado', label: 'Não identificado' },
] as const

export const PORTE_OPCOES = [
  { valor: 'pequeno', label: 'P', sub: 'até 10kg' },
  { valor: 'medio', label: 'M', sub: '10–25kg' },
  { valor: 'grande', label: 'G', sub: '25kg+' },
] as const

export const PELAGEM_OPCOES = [
  { valor: 'curta', label: 'Curta' },
  { valor: 'longa', label: 'Longa' },
] as const

export type CastracaoOpcao = 'nao_informado' | 'nao_castrado' | 'orquiectomia' | 'osh'

export const CASTRACAO_OPCOES: { valor: CastracaoOpcao; label: string; sub: string }[] = [
  { valor: 'nao_informado', label: 'Não informado', sub: 'Sem resposta' },
  { valor: 'nao_castrado', label: 'Não castrado', sub: 'A agendar' },
  { valor: 'orquiectomia', label: 'Orquiectomia', sub: 'Macho castrado' },
  { valor: 'osh', label: 'OSH', sub: 'Fêmea castrada' },
]

export const CONDICAO_OUTRAS = 'outras'

export function animalCastrado(opcao: CastracaoOpcao | undefined): boolean {
  return opcao === 'orquiectomia' || opcao === 'osh'
}

export function castracaoParaEsterilizado(opcao: CastracaoOpcao): boolean | null {
  if (opcao === 'nao_informado') return null
  return opcao !== 'nao_castrado'
}

export function esterilizadoParaCastracao(esterilizado: boolean | null, sexo: string): CastracaoOpcao {
  if (esterilizado === null) return 'nao_informado'
  if (!esterilizado) return 'nao_castrado'
  return sexo === 'femea' ? 'osh' : 'orquiectomia'
}

export const STATUS_TRANSFERIDO = 'transferido'

export const animalFormSchema = z.object({
  nome: z.string().trim().min(1, 'Informe o nome do animal.').max(80, 'Máximo de 80 caracteres.'),
  especie: z.string().min(1, 'Selecione a espécie.'),
  sexo: z.enum(['macho', 'femea', 'nao_identificado'], { message: 'Selecione o sexo.' }),
  raca: z.string().trim().max(80, 'Máximo de 80 caracteres.').optional(),
  coloracao: z.string().trim().max(80, 'Máximo de 80 caracteres.').optional(),
  pelagem: z.enum(['curta', 'longa']).optional(),
  porte: z.enum(['pequeno', 'medio', 'grande']).optional(),
  pesoKg: z.number().positive('O peso deve ser maior que zero.').optional(),
  idadeAprox: z.string().trim().max(30, 'Máximo de 30 caracteres.').optional(),
  dataNascimentoAprox: z
    .string()
    .refine(naoEhFutura, 'A data de nascimento não pode ser futura.')
    .optional(),
  microchip: z.string().trim().max(30, 'Máximo de 30 caracteres.').optional(),
  numeroMedalha: z.string().trim().max(30, 'Máximo de 30 caracteres.').optional(),
  dataImplantacaoChip: z
    .string()
    .refine(naoEhFutura, 'A data de implantação não pode ser futura.')
    .optional(),
  procedencia: z.string().trim().max(200, 'Máximo de 200 caracteres.').optional(),
  laudoEutanasia: z.string().trim().max(4000, 'Máximo de 4000 caracteres.').optional(),
  tipoDestinoTransferencia: z.enum(['ORGAO_PUBLICO', 'ENTIDADE_PROTECAO', 'OUTRO_CCZ', 'OUTRO']).optional(),
  destinoTransferencia: z.string().trim().max(200, 'Máximo de 200 caracteres.').optional(),
  dataSaida: z
    .string()
    .refine((valor) => naoEhFutura(valor.slice(0, 10)), 'A data de saída não pode ser futura.')
    .optional(),
  documentoTransferencia: z.string().trim().max(120, 'Máximo de 120 caracteres.').optional(),
  esterilizado: z.boolean().nullable(),
  dataEsterilizacao: z
    .string()
    .refine(naoEhFutura, 'A data da castração não pode ser futura.')
    .optional(),
  status: z.string().min(1, 'Selecione o status.'),
  motivoEntrada: z.string().min(1, 'Selecione o motivo de entrada.'),
  dataEntrada: z
    .string()
    .min(1, 'Informe a data de entrada.')
    .refine(naoEhFutura, 'A data de entrada não pode ser futura.'),
  baiaId: z.string().optional(),
  fotoUrl: z.string().optional(),
  observacoes: z.string().trim().max(2000, 'Máximo de 2000 caracteres.').optional(),
  condicoes: z.array(z.string()),
  condicoesOutras: z.string().trim().max(500, 'Máximo de 500 caracteres.').optional(),
})

export const animalFormUiSchema = animalFormSchema
  .omit({ esterilizado: true })
  .extend({
    castracaoOpcao: z.enum(['nao_informado', 'nao_castrado', 'orquiectomia', 'osh']),
  })
  .superRefine((dados, ctx) => {
    if (dados.condicoes.includes(CONDICAO_OUTRAS) && !dados.condicoesOutras?.trim()) {
      ctx.addIssue({ code: 'custom', path: ['condicoesOutras'], message: 'Descreva qual é a outra condição.' })
    }
    if (dados.dataNascimentoAprox && dados.dataEntrada && dados.dataNascimentoAprox > dados.dataEntrada) {
      ctx.addIssue({
        code: 'custom',
        path: ['dataNascimentoAprox'],
        message: 'A data de nascimento não pode ser posterior à data de entrada.',
      })
    }
    if (dados.status === STATUS_TRANSFERIDO) {
      if (!dados.tipoDestinoTransferencia) {
        ctx.addIssue({ code: 'custom', path: ['tipoDestinoTransferencia'], message: 'Selecione o tipo de destino.' })
      }
      if (!dados.destinoTransferencia?.trim()) {
        ctx.addIssue({ code: 'custom', path: ['destinoTransferencia'], message: 'Informe o órgão ou a entidade de destino.' })
      }
      if (!dados.dataSaida) {
        ctx.addIssue({ code: 'custom', path: ['dataSaida'], message: 'Informe a data de saída.' })
      } else if (dados.dataEntrada && dados.dataSaida.slice(0, 10) < dados.dataEntrada) {
        ctx.addIssue({
          code: 'custom',
          path: ['dataSaida'],
          message: 'A data de saída não pode ser anterior à data de entrada.',
        })
      }
    }
  })
export type AnimalFormUiValues = z.infer<typeof animalFormUiSchema>
