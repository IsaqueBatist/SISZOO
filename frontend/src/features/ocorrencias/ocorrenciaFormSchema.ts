import { z } from 'zod'
import { MAXIMO_ANEXOS } from './anexoOcorrencia'
import type { TipoOcorrencia } from './ocorrencias.types'

export const TIPOS_OCORRENCIA_VALORES: TipoOcorrencia[] = ['zoonose', 'morcegos', 'irregular', 'agressivo', 'outros']

const denuncianteSchema = z.object({
  nome: z.string().trim().optional(),
  cpf: z.string().trim().optional(),
  telefone: z.string().trim().optional(),
  email: z.string().trim().optional(),
  cep: z.string().trim().optional(),
  endereco: z.string().trim().optional(),
  bairroResidencial: z.string().trim().optional(),
})

const denunciadoSchema = z.object({
  nome: z.string().trim().optional(),
  cpf: z.string().trim().optional(),
  telefone: z.string().trim().optional(),
  endereco: z.string().trim().optional(),
  observacoes: z.string().trim().optional(),
})

// Campos espelham CriarOcorrenciaRequest (ocorrencias.types.ts), modelado a
// partir de docs/DER.md §3.4 — ver comentário PROVISÓRIO lá.
export const ocorrenciaFormSchema = z
  .object({
    tipoOcorrencia: z.enum(TIPOS_OCORRENCIA_VALORES as [string, ...string[]], {
      message: 'Selecione o tipo da ocorrência.',
    }),
    dataAbertura: z.string().min(1, 'Informe a data de abertura.'),
    horaAbertura: z.string().trim().optional(),
    endereco: z.string().trim().min(1, 'Informe o endereço da ocorrência.'),
    bairro: z.string().trim().min(1, 'Informe o bairro.'),
    pontoReferencia: z.string().trim().optional(),
    descricao: z.string().trim().min(1, 'Informe a descrição da ocorrência.'),
    sigilosa: z.boolean(),
    denunciante: denuncianteSchema,
    denunciadoAtivo: z.boolean(),
    denunciado: denunciadoSchema,
    anexos: z.array(z.instanceof(File)).max(MAXIMO_ANEXOS, `Máximo de ${MAXIMO_ANEXOS} anexos.`),
  })
  .superRefine((dados, ctx) => {
    // DER.md §3.4 (tabela `denunciante`): nome obrigatório quando a
    // ocorrência não é sigilosa.
    if (!dados.sigilosa && !dados.denunciante.nome) {
      ctx.addIssue({
        code: 'custom',
        path: ['denunciante', 'nome'],
        message: 'Informe o nome do denunciante ou marque a ocorrência como sigilosa.',
      })
    }
  })

export type OcorrenciaFormValues = z.infer<typeof ocorrenciaFormSchema>
