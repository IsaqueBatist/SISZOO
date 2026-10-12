import { z } from 'zod'
import type { CatalogoItem, StatusOcorrencia } from '../types/ocorrencias.types'

// D5: direto de ABERTA para ENCERRADA só com estas providências (mesmo
// conjunto de ProvidenciaTomada.java no backend, que é quem valida de fato).
// O catálogo /ocorrencias/catalogos traz só código e nome, sem essa regra —
// por isso o filtro fica aqui, pelo código.
const PROVIDENCIAS_SEM_ATENDIMENTO: readonly string[] = ['sem_acao', 'orientacao_municipe', 'registro_indevido']

export function providenciasPermitidas(status: StatusOcorrencia, providencias: CatalogoItem[]): CatalogoItem[] {
  if (status === 'ABERTA') {
    return providencias.filter((providencia) => PROVIDENCIAS_SEM_ATENDIMENTO.includes(providencia.codigo))
  }
  return providencias
}

// `providenciaTomada` obrigatória (DER.md §3.4, regra 12): a string vazia é
// o <option> placeholder; as opções vêm do catálogo do backend, que valida o
// código de fato. `descricaoEncerramento` só é obrigatória quando a
// providência é "outro" — validado em superRefine porque depende do valor de
// outro campo.
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
