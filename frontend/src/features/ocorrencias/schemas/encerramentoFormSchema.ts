import { z } from 'zod'

// Opções do catálogo `providencia_tomada` (docs/DER.md §3.4), na ordem do
// protótipo docs/prototipo/ocorrencia.html.
export const PROVIDENCIA_OPCOES = [
  { valor: 'orientacao_municipe', label: 'Orientação ao munícipe' },
  { valor: 'encaminhamento_gepar', label: 'Encaminhamento ao GEPAR' },
  { valor: 'abertura_processo', label: 'Abertura de processo sanitário' },
  { valor: 'captura_remocao', label: 'Captura e remoção do animal' },
  { valor: 'sem_acao', label: 'Sem ação necessária' },
  { valor: 'outro', label: 'Outro (descrever abaixo)' },
] as const

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
