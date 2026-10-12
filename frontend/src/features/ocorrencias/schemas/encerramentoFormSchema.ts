import { z } from 'zod'
import type { ProvidenciaTomada, StatusOcorrencia } from '../types/ocorrencias.types'

// Opções do catálogo `providencia_tomada` (docs/DER.md §3.4), na ordem do
// protótipo docs/prototipo/ocorrencia.html. `registro_indevido` é a D34.
export const PROVIDENCIA_OPCOES: readonly { valor: ProvidenciaTomada; label: string }[] = [
  { valor: 'orientacao_municipe', label: 'Orientação ao munícipe' },
  { valor: 'encaminhamento_gepar', label: 'Encaminhamento ao GEPAR' },
  { valor: 'abertura_processo', label: 'Abertura de processo sanitário' },
  { valor: 'captura_remocao', label: 'Captura e remoção do animal' },
  { valor: 'sem_acao', label: 'Sem ação necessária' },
  { valor: 'outro', label: 'Outro (descrever abaixo)' },
  { valor: 'registro_indevido', label: 'Registro duplicado/indevido' },
]

// D5: direto de ABERTA para ENCERRADA só com estas providências (mesmo
// conjunto de ProvidenciaTomada.java no backend, que é quem valida de fato).
const PROVIDENCIAS_SEM_ATENDIMENTO: readonly ProvidenciaTomada[] = ['sem_acao', 'orientacao_municipe', 'registro_indevido']

export function providenciasPermitidas(status: StatusOcorrencia) {
  if (status === 'ABERTA') {
    return PROVIDENCIA_OPCOES.filter((opcao) => PROVIDENCIAS_SEM_ATENDIMENTO.includes(opcao.valor))
  }
  return PROVIDENCIA_OPCOES
}

const VALORES_PROVIDENCIA = PROVIDENCIA_OPCOES.map((opcao) => opcao.valor)

// `providenciaTomada` obrigatória (DER.md §3.4, regra 12); z.enum já rejeita
// a string vazia do <option> placeholder. `descricaoEncerramento` só é
// obrigatória quando a providência é "outro" — validado em superRefine
// porque depende do valor de outro campo.
export const encerramentoFormSchema = z
  .object({
    providenciaTomada: z.enum(VALORES_PROVIDENCIA as [string, ...string[]], {
      message: 'Selecione a providência tomada.',
    }),
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
