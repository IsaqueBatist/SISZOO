import { z } from 'zod'
import { amostraSchema, responsavelSchema, type ProcessoFormValues } from './processoFormSchema'

export const processoEdicaoSchema = z.object({
  doenca: z.string().min(1, 'Selecione a doença investigada.'),
  laboratorio: z.string().min(1, 'Selecione o laboratório de destino.'),
  galNumero: z.string().trim().max(40, 'No máximo 40 caracteres.').optional(),
  sinanNumero: z.string().trim().max(40, 'No máximo 40 caracteres.').optional(),
  observacoes: z.string().trim().optional(),
  responsavel: responsavelSchema,
  amostras: z.array(amostraSchema).min(1),
  justificativa: z
    .string()
    .trim()
    .min(10, 'Descreva o motivo da alteração em pelo menos 10 caracteres.')
    .max(1000, 'No máximo 1000 caracteres.'),
})

export type ProcessoEdicaoValues = ProcessoFormValues & { justificativa: string }
