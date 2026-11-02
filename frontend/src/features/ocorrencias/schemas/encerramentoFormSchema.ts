import { z } from 'zod'
import type { CatalogoItem, StatusOcorrencia } from '../types/ocorrencias.types'

const PROVIDENCIAS_SEM_ATENDIMENTO: readonly string[] = ['sem_acao', 'orientacao_municipe', 'registro_indevido']

export function providenciasPermitidas(status: StatusOcorrencia, providencias: CatalogoItem[]): CatalogoItem[] {
  if (status === 'ABERTA') {
    return providencias.filter((providencia) => PROVIDENCIAS_SEM_ATENDIMENTO.includes(providencia.codigo))
  }
  return providencias
}

export const encerramentoFormSchema = z
  .object({
    providenciaTomada: z.string().min(1, 'Selecione a providência tomada.'),
    descricaoEncerramento: z.string().trim().optional(),
  })
  .superRefine((dados, ctx) => {
    if (dados.providenciaTomada === 'outro' && !dados.descricaoEncerramento) {
      ctx.addIssue({
        code: 'custom',
        path: ['descricaoEncerramento'],
        message: 'Descreva a providência tomada quando selecionar "Outro".',
      })
    }
  })

export type EncerramentoFormValues = z.infer<typeof encerramentoFormSchema>
